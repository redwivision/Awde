import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getGeminiClient,
  generateFallbackUnit,
  generateFallbackFeynmanEvaluation,
  generateFallbackQuestions,
  generateFallbackBlurting,
  generateFallbackNodeAnswer,
  withTimeout,
  AI_TIMEOUT_MS
} from './server/ai';
import { processTextbookPdf } from './server/textbook';
import { registerSyncRoutes } from './server/sync';
import { runMigrations } from './server/db/migrate';
import { hasDb } from './server/db/client';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 120;
const rateLimitBuckets = new Map<string, number[]>();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].trim();
  return req.ip || 'unknown';
}

// Rate limiting is scoped to the AI-generation POST endpoints only, never to
// static assets or the health check. This prevents a legitimate student using
// chat-heavy features (Ask Rooty, Feynman, AI quizzes) — or a dev server
// serving module bundles through the same origin — from tripping the limit.
function makeRateLimiter(maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  return function enforceRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
    const ip = getClientIp(req);
    const now = Date.now();
    const timestamps = rateLimitBuckets.get(ip) || [];
    const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }

    recent.push(now);
    rateLimitBuckets.set(ip, recent);
    next();
  };
}

function getSafeJsonBody(req: express.Request, res: express.Response): Record<string, any> | null {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(400).json({ error: 'Request body must be a JSON object.' });
    return null;
  }
  return body as Record<string, any>;
}

app.use(express.json({ limit: '10mb' }));

// Return a safe, human-friendly error message. In production we never leak
// internal error details (Gemini SDK internals, stack traces) to clients.
function safeErrorMessage(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (process.env.NODE_ENV === 'production') {
    return fallback;
  }
  return msg || fallback;
}
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON payload.' });
  }
  next(err);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// In-memory multer storage for textbook PDF uploads (no disk writes needed).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max (protects free-tier API quotas)
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported.'));
    }
  }
});

// API: Upload a real textbook PDF -> extract text -> build an AI mastery workspace
app.post('/api/textbook/process', upload.single('file'), async (req, res) => {
  try {
    const genericError = 'Could not process the textbook. Please try again or use a Quick-Start sample.';
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file was uploaded.' });
    }

    const bookTitle = String(req.body?.bookTitle || '').trim() || req.file.originalname.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    const subject = String(req.body?.subject || 'Science').trim() || 'Science';
    const gradeLevel = String(req.body?.gradeLevel || 'Not specified').trim() || 'Not specified';

    const { workspace, extractedPages, textLength } = await processTextbookPdf(
      req.file.buffer,
      req.file.originalname,
      bookTitle,
      subject,
      gradeLevel
    );

    res.json({
      success: true,
      workspace,
      generatedByAI: Boolean(workspace.generatedByAI),
      extractedPages,
      textLength
    });
  } catch (error: any) {
    const isValidation = error instanceof multer.MulterError || error?.message?.includes('Only PDF files');
    console.error('Error processing textbook:', error);
    res.status(isValidation ? 400 : 500).json({
      error: safeErrorMessage(error, isValidation ? error.message : 'Could not process the textbook. Please try again.')
    });
  }
});

// API: Generate Mind-Map & Concept Breakdown
app.post('/api/mindmap/generate', makeRateLimiter(), async (req, res) => {
  const body = getSafeJsonBody(req, res);
  if (!body) return;
  const { topic, textbookText, subject, gradeLevel, language } = body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback deterministic generator if API key is not yet set
      return res.json({
        success: true,
        isFallback: true,
        unit: generateFallbackUnit(topic || 'Concept Study', subject || 'Science', textbookText || '')
      });
    }

    const systemPrompt = `You are Awde's Master Concept Architect and EdTech Pedagogy Engine.
Your task is to take a textbook unit, chapter, or topic, and deconstruct it into a clean, hierarchical Mind-Map graph with deep educational pedagogy.
CRITICAL MANDATES:
1. Break into 4 to 6 logical ConceptNodes.
2. Structure nodes with depthLevel: 1 for Core Foundation, 2 for Mechanism/Law, 3 for Real-world Application.
3. Every node MUST have both English AND rich Amharic translations (label, summary, detailedExplanation, keyTakeaways, misconceptions).
4. Every node MUST have a detailedExplanation (2-4 sentences going deeper than the summary) and 3-5 keyTakeaways (concise bullet points of the most important things to remember).
5. Every node MUST have a localized, culturally resonant analogy (especially connecting to Ethiopian daily life, culture, engineering, e.g. Jebena Buna, Injera Mitad, Merkato trade, Equb savings, Blue Nile/GERD, Addis Ababa Light Rail, Teff farming, Telem plowing) so students grasp it deeply.
6. Create logical connections (depends_on, causes, contains, transforms_into) between nodes with coordinates x (150 to 750) and y (100 to 450).
7. Include 3-4 rigorous textbook quiz questions with Amharic options and 2-3 flashcards.

Format response strictly as valid JSON matching the requested schema.`;

    const prompt = `Deconstruct the following textbook/topic into a full Awde Mind-Map Unit:
Topic / Title: ${topic || 'Key Textbook Unit'}
Subject: ${subject || 'General STEM'}
Grade/Level: ${gradeLevel || 'Secondary / University'}
Textbook Extract or Outline:
${(textbookText || topic || 'Key core concepts and formulas').slice(0, 4000)}
Primary Language: ${language === 'am' ? 'Amharic (አማርኛ) prioritized alongside English' : 'English with complete Amharic translations'}`;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            titleAmharic: { type: Type.STRING },
            subject: { type: Type.STRING },
            subjectAmharic: { type: Type.STRING },
            gradeOrLevel: { type: Type.STRING },
            textbookSource: { type: Type.STRING },
            chapter: { type: Type.STRING },
            description: { type: Type.STRING },
            descriptionAmharic: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  labelAmharic: { type: Type.STRING },
                  category: { type: Type.STRING },
                  depthLevel: { type: Type.INTEGER },
                  masteryScore: { type: Type.INTEGER },
                  masteryStatus: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  summaryAmharic: { type: Type.STRING },
                  detailedExplanation: { type: Type.STRING },
                  detailedExplanationAmharic: { type: Type.STRING },
                  keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyTakeawaysAmharic: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyFormulasOrRules: { type: Type.ARRAY, items: { type: Type.STRING } },
                  commonMisconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  misconceptionsAmharic: { type: Type.ARRAY, items: { type: Type.STRING } },
                  localizedAnalogy: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      titleAmharic: { type: Type.STRING },
                      context: { type: Type.STRING },
                      contextAmharic: { type: Type.STRING },
                      culturalElement: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      explanationAmharic: { type: Type.STRING }
                    },
                    required: ['title', 'titleAmharic', 'culturalElement', 'explanation', 'explanationAmharic']
                  },
                  prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER }
                },
                required: ['id', 'label', 'labelAmharic', 'category', 'depthLevel', 'summary', 'summaryAmharic', 'detailedExplanation', 'keyTakeaways', 'keyFormulasOrRules', 'commonMisconceptions', 'misconceptionsAmharic', 'localizedAnalogy', 'prerequisites', 'x', 'y']
              }
            },
            connections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  label: { type: Type.STRING },
                  labelAmharic: { type: Type.STRING },
                  relationType: { type: Type.STRING }
                },
                required: ['id', 'from', 'to', 'label', 'relationType']
              }
            },
            quizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  nodeId: { type: Type.STRING },
                  nodeLabel: { type: Type.STRING },
                  question: { type: Type.STRING },
                  questionAmharic: { type: Type.STRING },
                  type: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  optionsAmharic: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  explanationAmharic: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'difficulty']
              }
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  nodeId: { type: Type.STRING },
                  front: { type: Type.STRING },
                  frontAmharic: { type: Type.STRING },
                  back: { type: Type.STRING },
                  backAmharic: { type: Type.STRING },
                  boxLevel: { type: Type.INTEGER },
                  nextReviewDate: { type: Type.STRING }
                },
                required: ['id', 'front', 'back', 'boxLevel']
              }
            }
          },
          required: ['title', 'titleAmharic', 'subject', 'nodes', 'connections', 'quizQuestions', 'flashcards']
        }
      }
    }), AI_TIMEOUT_MS);

    const parsed = JSON.parse(response.text || '{}');
    const unitId = 'unit_' + Date.now();
    const finalUnit = {
      id: unitId,
      overallMastery: 0,
      createdAt: new Date().toISOString().split('T')[0],
      ...parsed
    };

    res.json({ success: true, unit: finalUnit });
  } catch (error: any) {
    console.error('Error generating mindmap:', error);
    // AI failed (timeout/network/API) — never error the student; fall back deterministically.
    res.json({ success: true, isFallback: true, unit: generateFallbackUnit(topic || 'Concept Study', subject || 'Science', textbookText || '') });
  }
});

// API: Rooty Socratic Feynman Evaluation
app.post('/api/feynman/evaluate', makeRateLimiter(), async (req, res) => {
  const body = getSafeJsonBody(req, res);
  if (!body) return;
  const {
    nodeLabel,
    nodeSummary,
    userExplanation,
    language,
    strictnessLevel, // 'gentle' | 'balanced' | 'ironclad'
    chatHistory
  } = body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        evaluation: generateFallbackFeynmanEvaluation(nodeLabel, userExplanation, strictnessLevel)
      });
    }

    const strictnessGuideline =
      strictnessLevel === 'ironclad'
        ? 'Be extremely strict. Flag ANY unexplained buzzwords or circular definitions. Reject memorized quotes. Require concrete real-world intuition as if teaching a skeptical 8-year-old child. Only grant >=75 score if explanation is crystal-clear and genuinely intuitive.'
        : strictnessLevel === 'gentle'
        ? 'Be encouraging and pedagogical. Praise good attempts, point out 1 key missing intuition gently, and give a score >= 70 if the core direction is right.'
        : 'Balanced Feynman rigor. Reward intuitive analogies and plain speech. Flag buzzwords that mask shallow understanding, and probe the weak link with a sharp follow-up question.';

    const systemPrompt = `You are "Rooty", the strict, brilliant, and expressive Socratic AI student and evaluator in the Awde learning system.
Your mission is to enforce the Feynman Technique: The user's job is to teach YOU the concept so clearly and intuitively that even an 8-year-old or a curious beginner understands it without textbook jargon.

ROOTY'S PERSONALITY & EMOTIONS:
- Rooty expresses vivid emotions:
  - "skeptical" (when the user uses big words like "entropy", "equilibrium", "gradient" without explaining what they actually mean in the physical world)
  - "confused" (when the sentence structure is muddled or contradictory)
  - "stern" (when user clearly just copied a textbook sentence or gave a lazy 5-word answer)
  - "intrigued" (when user starts a clever analogy or fresh angle)
  - "convinced" (when user provides a crisp, intuitive, grounded explanation with a great analogy)
  - "proud" (when user achieves genuine mastery with zero fluff)
  - "challenging" (when user is 80% there but forgot a crucial boundary condition)

STRICTNESS MODE: ${strictnessGuideline}

LANGUAGE:
The student has selected: ${language === 'am' ? 'Amharic (አማርኛ)' : 'English'}.
- If the student's interface language is Amharic, your PRIMARY "rootyCritiqueAmharic" and "followUpQuestionAmharic" fields must be natural, idiomatic, fluent Amharic (አማርኛ) as a native speaker would write — not a literal word-for-word translation of the English. Keep "rootyCritique" as a faithful English version too.
- If the student's interface language is English, still provide a complete, natural "rootyCritiqueAmharic" alongside the English "rootyCritique".
- Avoid mixing scripts or leaving untranslated English words where a natural Amharic term exists; keep technical terms in parentheses only when helpful.

Output must strictly be valid JSON.`;

    const prompt = `Node / Concept being taught: ${nodeLabel}
Concept Standard Definition / Truth: ${nodeSummary}
User's Explanation / Lesson:
"${userExplanation}"

Previous dialogue context if any:
${JSON.stringify(chatHistory || [])}

Evaluate this Feynman attempt now.`;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: '0 to 100 grade based on genuine Feynman clarity' },
            passed: { type: Type.BOOLEAN, description: 'True if score is 75 or above' },
            emotion: {
              type: Type.STRING,
              description: 'One of: neutral, skeptical, confused, stern, intrigued, convinced, proud, challenging'
            },
            rootyCritique: { type: Type.STRING, description: 'Rooty direct Socratic response to the user in English' },
            rootyCritiqueAmharic: { type: Type.STRING, description: 'Rooty response in authentic Amharic (አማርኛ)' },
            rubric: {
              type: Type.OBJECT,
              properties: {
                simplicity: { type: Type.INTEGER, description: '0-10' },
                clarity: { type: Type.INTEGER, description: '0-10' },
                jargonAvoidance: { type: Type.INTEGER, description: '0-10' },
                analogyQuality: { type: Type.INTEGER, description: '0-10' },
                accuracy: { type: Type.INTEGER, description: '0-10' }
              },
              required: ['simplicity', 'clarity', 'jargonAvoidance', 'analogyQuality', 'accuracy']
            },
            detectedJargon: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Technical terms user used without breaking down'
            },
            followUpQuestion: { type: Type.STRING, description: 'A sharp probing question from Rooty to test depth' },
            followUpQuestionAmharic: { type: Type.STRING, description: 'Probing question in Amharic' },
            praiseComment: { type: Type.STRING }
          },
          required: [
            'score',
            'passed',
            'emotion',
            'rootyCritique',
            'rootyCritiqueAmharic',
            'rubric',
            'detectedJargon',
            'followUpQuestion',
            'followUpQuestionAmharic'
          ]
        }
      }
    }), AI_TIMEOUT_MS);

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    console.error('Error evaluating Feynman attempt:', error);
    // AI failed — never error the student; fall back deterministically.
    res.json({ success: true, isFallback: true, evaluation: generateFallbackFeynmanEvaluation(nodeLabel, userExplanation, strictnessLevel) });
  }
});

// API: Ask Rooty — lightweight Q&A about a concept node
app.post('/api/node/ask', makeRateLimiter(), async (req, res) => {
  const body = getSafeJsonBody(req, res);
  if (!body) return;
  const { nodeLabel, nodeSummary, question, language, chatHistory } = body;

  if (!question || !String(question).trim()) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        ...generateFallbackNodeAnswer(nodeLabel, question)
      });
    }

    const systemPrompt = `You are "Rooty", a sharp, witty, and encouraging AI tutor in the Awde learning system.
Your job is to answer student questions about a specific concept clearly and intuitively.
- Use plain language, avoid jargon, and include Ethiopian cultural analogies when helpful.
- Keep answers concise (3-5 sentences) but insightful.
- If the student's question is vague, gently redirect them to be more specific.
- LANGUAGE: The student's interface language is ${language === 'am' ? 'Amharic (አማርኛ)' : 'English'}. When it's Amharic, make "answerAmharic" natural, idiomatic, fluent Amharic as a native speaker would write (not a literal word-for-word translation) and keep "answer" as a faithful English version. When it's English, still provide a complete, natural "answerAmharic" alongside the "answer".
- Be warm and encouraging, like a brilliant older sibling helping with homework.`;

    const prompt = `Concept: ${nodeLabel}
Standard Definition: ${nodeSummary || 'No summary available.'}

Student's question: "${question}"

${chatHistory && chatHistory.length > 0 ? `Previous conversation:\n${JSON.stringify(chatHistory.slice(-6))}` : ''}

Answer the student's question now. Be clear, concise, and encouraging.`;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            answerAmharic: { type: Type.STRING }
          },
          required: ['answer', 'answerAmharic']
        }
      }
    }), AI_TIMEOUT_MS);

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, answer: parsed.answer, answerAmharic: parsed.answerAmharic });
  } catch (error: any) {
    console.error('Error in node ask:', error);
    // AI failed — never error the student; Rooty answers deterministically instead.
    res.json({ success: true, isFallback: true, ...generateFallbackNodeAnswer(nodeLabel, question) });
  }
});

// API: Generate Unlimited Diagnostic Quizzes
app.post('/api/quiz/generate', makeRateLimiter(), async (req, res) => {
  const body = getSafeJsonBody(req, res);
  if (!body) return;
  const { topic, textbookText, count = 5, difficulty = 'adaptive' } = body;
  const parsedCount = Number(count);
  const safeCount = Number.isFinite(parsedCount) ? Math.max(1, Math.min(20, parsedCount)) : 5;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        questions: generateFallbackQuestions(topic, safeCount)
      });
    }

    const systemPrompt = `You are Awde's Quiz & Diagnostic Assessment Engine.
Generate high-yield, conceptual multiple-choice and scenario questions based strictly on the provided textbook context or topic.
Include common misconception traps as plausible distractors. Provide complete bilingual English and Amharic question text, options, and explanations.`;

    const prompt = `Generate ${safeCount} ${difficulty} conceptual quiz questions for:
Topic: ${topic}
Textbook Context: ${(textbookText || topic).slice(0, 3000)}`;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              questionAmharic: { type: Type.STRING },
              type: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              optionsAmharic: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              explanationAmharic: { type: Type.STRING },
              difficulty: { type: Type.STRING }
            },
            required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'difficulty']
          }
        }
      }
    }), AI_TIMEOUT_MS);

    const parsed = JSON.parse(response.text || '[]');
    res.json({ success: true, questions: parsed });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    // AI failed — never error the student; fall back deterministically.
    res.json({ success: true, isFallback: true, questions: generateFallbackQuestions(topic, safeCount) });
  }
});

// API: Blurting Active Recall Evaluation
app.post('/api/blurting/evaluate', makeRateLimiter(), async (req, res) => {
  const body = getSafeJsonBody(req, res);
  if (!body) return;
  const { topicTitle, targetKeyPoints, userRecallText } = body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        ...generateFallbackBlurting(targetKeyPoints)
      });
    }

    const systemPrompt = `You evaluate active recall (the Blurting Method). The student was given 3 minutes to type everything they remember about a topic. Compare their blurt against the target key concepts. Give an accuracy score, list what they correctly retrieved, what they missed, and provide constructive feedback in English and Amharic.`;

    const prompt = `Topic: ${topicTitle}
Target Key Points to know: ${JSON.stringify(targetKeyPoints)}
Student's Blurting Recall text:
"${userRecallText}"`;

    const response = await withTimeout(ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accuracyScore: { type: Type.INTEGER },
            recalledKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            missedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            feedback: { type: Type.STRING },
            feedbackAmharic: { type: Type.STRING }
          },
          required: ['accuracyScore', 'recalledKeyPoints', 'missedKeyPoints', 'feedback', 'feedbackAmharic']
        }
      }
    }), AI_TIMEOUT_MS);

    res.json({ success: true, ...JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Error evaluating blurting:', error);
    // AI failed — never error the student; fall back deterministically.
    res.json({ success: true, isFallback: true, ...generateFallbackBlurting(targetKeyPoints) });
  }
});


// Vite middleware or static serving
export async function startServer(port: number = PORT): Promise<any> {
  // When a DB is configured, apply migrations and enable server-side auth+sync.
  if (hasDb()) {
    try {
      await runMigrations();
    } catch (err) {
      console.error('DB migration failed (continuing in local-only mode):', err);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return new Promise((resolve) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`Awde server running on http://0.0.0.0:${port}`);
      resolve(server);
    });
  });
}

// Register auth + sync routes at module load (before any server/static
// middleware). Done here — not inside startServer — so tests that import the
// app directly get the same routing the running server has.
registerSyncRoutes(app);

// Guard: only auto-start when executed directly, not when imported for tests.
// Works in both the ESM dev path (tsx) and the CJS production bundle.
const isMain = (() => {
  try {
    // @ts-ignore - require is injected by the CJS esbuild bundle
    if (typeof require !== 'undefined' && typeof require.main !== 'undefined') {
      return require.main === module;
    }
    // @ts-ignore - import.meta only in ESM
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return import.meta.url === `file://${process.argv[1]}`;
    }
  } catch {
    /* ignore */
  }
  return false;
})();

export { app };

if (isMain) {
  startServer();
}
