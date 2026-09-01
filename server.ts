import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init Gemini SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// API: Generate Mind-Map & Concept Breakdown
app.post('/api/mindmap/generate', async (req, res) => {
  try {
    const { topic, textbookText, subject, gradeLevel, language } = req.body;
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
3. Every node MUST have both English AND rich Amharic translations (label, summary, misconceptions).
4. Every node MUST have a localized, culturally resonant analogy (especially connecting to Ethiopian daily life, culture, engineering, e.g. Jebena Buna, Injera Mitad, Merkato trade, Equb savings, Blue Nile/GERD, Addis Ababa Light Rail, Teff farming, Telem plowing) so students grasp it deeply.
5. Create logical connections (depends_on, causes, contains, transforms_into) between nodes with coordinates x (150 to 750) and y (100 to 450).
6. Include 3-4 rigorous textbook quiz questions with Amharic options and 2-3 flashcards.

Format response strictly as valid JSON matching the requested schema.`;

    const prompt = `Deconstruct the following textbook/topic into a full Awde Mind-Map Unit:
Topic / Title: ${topic || 'Key Textbook Unit'}
Subject: ${subject || 'General STEM'}
Grade/Level: ${gradeLevel || 'Secondary / University'}
Textbook Extract or Outline:
${(textbookText || topic || 'Key core concepts and formulas').slice(0, 4000)}
Primary Language: ${language === 'am' ? 'Amharic (አማርኛ) prioritized alongside English' : 'English with complete Amharic translations'}`;

    const response = await ai.models.generateContent({
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
                required: ['id', 'label', 'labelAmharic', 'category', 'depthLevel', 'summary', 'summaryAmharic', 'localizedAnalogy', 'x', 'y']
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
    });

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
    res.status(500).json({ error: error.message || 'Failed to generate mindmap' });
  }
});

// API: Rooty Socratic Feynman Evaluation
app.post('/api/feynman/evaluate', async (req, res) => {
  try {
    const {
      nodeLabel,
      nodeSummary,
      userExplanation,
      language,
      strictnessLevel, // 'gentle' | 'balanced' | 'ironclad'
      chatHistory
    } = req.body;

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
Support both English and Amharic (አማርኛ). If user speaks Amharic or asks for Amharic feedback, provide rich, idiomatic Amharic critique alongside English.

Output must strictly be valid JSON.`;

    const prompt = `Node / Concept being taught: ${nodeLabel}
Concept Standard Definition / Truth: ${nodeSummary}
User's Explanation / Lesson:
"${userExplanation}"

Previous dialogue context if any:
${JSON.stringify(chatHistory || [])}

Evaluate this Feynman attempt now.`;

    const response = await ai.models.generateContent({
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
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    console.error('Error evaluating Feynman attempt:', error);
    res.status(500).json({ error: error.message || 'Evaluation failed' });
  }
});

// API: Generate Unlimited Diagnostic Quizzes
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic, textbookText, count = 5, difficulty = 'adaptive' } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        questions: generateFallbackQuestions(topic, count)
      });
    }

    const systemPrompt = `You are Awde's Quiz & Diagnostic Assessment Engine.
Generate high-yield, conceptual multiple-choice and scenario questions based strictly on the provided textbook context or topic.
Include common misconception traps as plausible distractors. Provide complete bilingual English and Amharic question text, options, and explanations.`;

    const prompt = `Generate ${count} ${difficulty} conceptual quiz questions for:
Topic: ${topic}
Textbook Context: ${(textbookText || topic).slice(0, 3000)}`;

    const response = await ai.models.generateContent({
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
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ success: true, questions: parsed });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error.message || 'Quiz generation failed' });
  }
});

// API: Blurting Active Recall Evaluation
app.post('/api/blurting/evaluate', async (req, res) => {
  try {
    const { topicTitle, targetKeyPoints, userRecallText } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        isFallback: true,
        accuracyScore: 78,
        recalledKeyPoints: targetKeyPoints.slice(0, 2),
        missedKeyPoints: targetKeyPoints.slice(2),
        feedback: 'Good recall of initial principles. Ensure you capture boundary limits and energy transfers.',
        feedbackAmharic: 'የመነሻ መርሆችን በጥሩ ሁኔታ አስታውሰሃል። የቀሩትን የጉልበት ዝውውር ነጥቦች ደግመህ ተመልከት።'
      });
    }

    const systemPrompt = `You evaluate active recall (the Blurting Method). The student was given 3 minutes to type everything they remember about a topic. Compare their blurt against the target key concepts. Give an accuracy score, list what they correctly retrieved, what they missed, and provide constructive feedback in English and Amharic.`;

    const prompt = `Topic: ${topicTitle}
Target Key Points to know: ${JSON.stringify(targetKeyPoints)}
Student's Blurting Recall text:
"${userRecallText}"`;

    const response = await ai.models.generateContent({
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
    });

    res.json({ success: true, ...JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Error evaluating blurting:', error);
    res.status(500).json({ error: error.message || 'Evaluation failed' });
  }
});

// Fallback Generators
function generateFallbackUnit(topic: string, subject: string, text: string) {
  return {
    id: 'unit_gen_' + Date.now(),
    title: topic || 'Organic Chemistry: Hydrocarbons & Reactions',
    titleAmharic: 'ኦርጋኒክ ኬሚስትሪ፡ ሃይድሮካርቦኖች እና ኬሚካላዊ ሂደቶች',
    subject: subject || 'Chemistry',
    subjectAmharic: 'ኬሚስትሪ',
    gradeOrLevel: 'Grade 11/12 STEM',
    textbookSource: 'National Curriculum Standard',
    chapter: 'Unit 3: Functional Groups & Hydrocarbon Isomerism',
    description: 'Systematic breakdown of organic molecules, bonding hybridization, and reaction mechanisms.',
    descriptionAmharic: 'የኦርጋኒክ ሞለኪውሎች፣ ቦንዶች እና ኬሚካላዊ ምላሾች ዝርዝር ስዕላዊ መግለጫ።',
    overallMastery: 0,
    createdAt: new Date().toISOString().split('T')[0],
    nodes: [
      {
        id: 'node_gen_01',
        label: 'Carbon Hybridization & Covalent Bonds',
        labelAmharic: 'የካርቦን ሃይብሪዳይዜሽን እና ኮቫለንት ቦንዶች',
        category: 'Foundation',
        depthLevel: 1,
        masteryScore: 0,
        masteryStatus: 'unstudied',
        summary: 'Carbon forms four covalent bonds due to sp3, sp2, or sp hybridization, creating tetrahedral, trigonal planar, or linear geometries.',
        summaryAmharic: 'ካርቦን በsp3, sp2 ወይም sp ሃይብሪዳይዜሽን አማካኝነት አራት ጠንካራ ኮቫለንት ቦንዶችን ይፈጥራል።',
        keyFormulasOrRules: ['sp3 = 109.5° tetrahedral', 'sp2 = 120° planar', 'sp = 180° linear'],
        commonMisconceptions: ['Thinking double bonds are twice as strong as single bonds (pi bond is weaker than sigma).'],
        misconceptionsAmharic: ['ድርብ ቦንድ ከነጠላ ቦንድ በሁለት እጥፍ ይጠነክራል ብሎ ማሰብ (ፓይ ቦንድ ከሲግማ ደካማ ነው)።'],
        localizedAnalogy: {
          title: 'The Ethiopian Traditional 3-Legged Wooden Wember (Stool)',
          titleAmharic: 'የባህል ባለ ሦስት እና ባለ አራት እግር ወንበር',
          context: 'Structural stability of traditional Ethiopian hand-carved stools.',
          contextAmharic: 'የእንጨት ወንበር ሚዛናዊ እግሮች አቀማመጥ።',
          culturalElement: 'Traditional Wember Stool (የእንጨት ወንበር)',
          explanation: 'Just like the angled legs of a wooden wember balance weight firmly in 3D space, carbon branches its 4 electron arms outward to avoid pushing each other away.',
          explanationAmharic: 'የእንጨት ወንበር እግሮች ሚዛን ለመጠበቅ ወደተለያየ አቅጣጫ እንደሚዘረጉ ሁሉ፣ የካርቦን ቦንዶችም ኤሌክትሮኖች እርስ በርሳቸው እንዳይገፋፉ በተመጣጠነ አንግል ይዘረጋሉ።'
        },
        prerequisites: [],
        x: 200,
        y: 150
      },
      {
        id: 'node_gen_02',
        label: 'Alkanes, Alkenes & Alkynes',
        labelAmharic: 'አልኬን፣ አልኪን እና አልካይን (ሃይድሮካርቦኖች)',
        category: 'Mechanism',
        depthLevel: 2,
        masteryScore: 0,
        masteryStatus: 'unstudied',
        summary: 'Saturated alkanes (C_n H_2n+2) contain single bonds; unsaturated alkenes (C_n H_2n) and alkynes (C_n H_2n-2) contain reactive double and triple bonds.',
        summaryAmharic: 'አልኬኖች ነጠላ ቦንድ ያላቸው ያልጠገቡ ሲሆኑ፣ አልኪኖች እና አልካይኖች ደግሞ ድርብና ባለ ሶስት ቦንድ አላቸው።',
        keyFormulasOrRules: ['Alkane: CnH2n+2', 'Alkene: CnH2n', 'Alkyne: CnH2n-2'],
        commonMisconceptions: ['Assuming saturated fats/alkanes are more chemically reactive than unsaturated ones.'],
        misconceptionsAmharic: ['የጠገቡ (saturated) ሃይድሮካርቦኖች ከድርብ ቦንዶች የበለጠ ፈጣን ምላሽ ይሰጣሉ ብሎ ማሰብ።'],
        localizedAnalogy: {
          title: 'Braided Enset Fiber Ropes',
          titleAmharic: 'የእንሰት/ቃጫ ገመድ ጠለፋ ጥንካሬ',
          context: 'Braiding single strands versus double tightly spun enset fibers in Gurage farming.',
          contextAmharic: 'የእንሰት ቃጫ ገመድ አፈታተል እና ጥንካሬ።',
          culturalElement: 'Enset Fiber Weaving (የእንሰት ቃጫ)',
          explanation: 'A single tightly coiled rope is sturdy like an alkane. Adding extra loose wraps (pi bonds) adds tension ready to snap open and grab other reactive reagents!',
          explanationAmharic: 'ነጠላ የተጠመዘዘ ገመድ ጠንካራ ነው፤ ተጨማሪ ዙሮች ሲታከሉበት ግን በፍጥነት ተፈትቶ ሌላ ነገር ለመያዝ ዝግጁ ይሆናል።'
        },
        prerequisites: ['node_gen_01'],
        x: 460,
        y: 150
      },
      {
        id: 'node_gen_03',
        label: 'Addition & Substitution Reactions',
        labelAmharic: 'የመደመር እና የመተካካት ኬሚካላዊ ምላሾች',
        category: 'Core Law',
        depthLevel: 3,
        masteryScore: 0,
        masteryStatus: 'unstudied',
        summary: 'Electrophilic addition breaks pi bonds to add atoms without loss, while substitution replaces one bonded atom with a new functional group.',
        summaryAmharic: 'የመደመር ምላሽ ድርብ ቦንድን በመስበር አዳዲስ አተሞችን ያክላል፤ የመተካካት ምላሽ ደግሞ አንዱን አተም በሌላ ይቀይራል።',
        keyFormulasOrRules: ['Markovnikov\'s Rule: Hydrogen adds to the carbon with more hydrogens already attached.'],
        commonMisconceptions: ['Forgetting Markovnikov regioselectivity in asymmetric alkene addition.'],
        misconceptionsAmharic: ['በአልኪን መደመር ወቅት ሃይድሮጅን የትኛው ካርቦን ላይ እንደሚቀላቀል ማምታታት።'],
        localizedAnalogy: {
          title: 'Merkato Seat Trading in a Minibus Taxi',
          titleAmharic: 'በታክሲ ውስጥ ወንበር መተካት ወይም ሰው መጨመር',
          context: 'Passengers swapping seats or folding down the middle jump seat to add another commuter.',
          contextAmharic: 'በሰማያዊ ታክሲ ውስጥ መቀመጫ መለዋወጥ።',
          culturalElement: 'Addis Minibus Commute (የታክሲ ጉዞ)',
          explanation: 'Substitution is when one passenger gets off at Mexico and another takes that exact seat. Addition is opening the fold-up seat (pi bond) so two new people can sit without anyone leaving!',
          explanationAmharic: 'መተካካት ማለት አንድ ሰው ሜክሲኮ ሲወርድ ሌላ ሰው ቦታውን ሲይዝ ነው፤ መደመር ማለት ደግሞ የታጠፈውን መካከለኛ ወንበር ዘርግቶ ማንም ሳይወርድ አዲስ ሰው ማስተናገድ ነው።'
        },
        prerequisites: ['node_gen_02'],
        x: 720,
        y: 150
      }
    ],
    connections: [
      {
        id: 'conn_gen_1_2',
        from: 'node_gen_01',
        to: 'node_gen_02',
        label: 'Hybridization dictates hydrocarbon geometry',
        labelAmharic: 'ሃይብሪዳይዜሽን የሞለኪውል ቅርጽን ይወስናል',
        relationType: 'depends_on'
      },
      {
        id: 'conn_gen_2_3',
        from: 'node_gen_02',
        to: 'node_gen_03',
        label: 'Multiple bonds enable addition reactions',
        labelAmharic: 'ድርብ ቦንዶች የመደመር ምላሽ እንዲካሄድ ያስችላሉ',
        relationType: 'causes'
      }
    ],
    quizQuestions: [
      {
        id: 'quiz_gen_01',
        nodeId: 'node_gen_02',
        nodeLabel: 'Hydrocarbon Formulas',
        question: 'Which of the following molecular formulas represents a stable saturated alkane?',
        questionAmharic: 'ከሚከተሉት ውስጥ የጠገበ አልኬን (Alkane) ፎርሙላ የቱ ነው?',
        type: 'mcq',
        options: ['C5H10', 'C5H12', 'C5H8', 'C6H6'],
        optionsAmharic: ['C5H10', 'C5H12', 'C5H8', 'C6H6'],
        correctIndex: 1,
        explanation: 'Alkanes follow the general formula C_n H_2n+2. For n=5: (2*5)+2 = 12, yielding pentane (C5H12).',
        explanationAmharic: 'አልኬኖች CnH2n+2 ቀመርን ይከተላሉ። ለ 5 ካርቦን (2*5)+2 = 12 ይሆናል፣ ይህም ፔንቴን (C5H12) ነው።',
        difficulty: 'easy'
      }
    ],
    flashcards: [
      {
        id: 'fc_gen_01',
        nodeId: 'node_gen_03',
        front: 'State Markovnikov\'s Rule in simple words.',
        frontAmharic: 'የማርኮቭኒኮቭን ሕግ በቀላል ቃላት ግለጽ።',
        back: '"The rich get richer": when adding H-X to an asymmetrical alkene, the hydrogen attaches to the carbon that already holds more hydrogens.',
        backAmharic: '"ያለው ይጨመርለታል"፡ ሃይድሮጅን ቀድሞውኑ ብዙ ሃይድሮጅን ወዳለው ካርቦን ይጣመራል።',
        boxLevel: 1,
        nextReviewDate: new Date().toISOString().split('T')[0]
      }
    ]
  };
}

function generateFallbackFeynmanEvaluation(nodeLabel: string, explanation: string, strictness: string) {
  const words = explanation.trim().split(/\s+/).length;
  const hasAnalogy = /like|as if|similar to|imagine|ለምሳሌ|ልክ እንደ|እንደ/i.test(explanation);
  const tooShort = words < 12;

  let score = 55;
  let emotion: any = 'skeptical';
  let critique = "You're throwing words around, but you haven't shown me the physical cause-and-effect. What happens on a molecular level?";
  let critiqueAmharic = "ቃላትን ተጠቀምክ እንጂ በውስጡ ምን እየተከናወነ እንዳለ በምሳሌ አላስረዳኸኝም። ለምሳሌ በዕለት ተዕለት ሕይወት እንዴት ይገለጻል?";
  let passed = false;

  if (tooShort) {
    score = 30;
    emotion = 'stern';
    critique = "Too brief! You cannot prove you understand something with just a sentence fragment. Teach me step-by-step!";
    critiqueAmharic = "በጣም አጭር ነው! አንድን ጽንሰ-ሀሳብ በአንድ አረፍተ-ነገር ብቻ ማስተማር አትችልም። ደረጃ በደረጃ አስረዳኝ!";
  } else if (hasAnalogy && words > 25) {
    score = strictness === 'ironclad' ? 78 : 88;
    emotion = 'convinced';
    passed = true;
    critique = "Now that makes intuitive sense! The comparison you used demystifies the mechanism cleanly. You have my confidence on this node.";
    critiqueAmharic = "አሁን ገባኝ! የተጠቀምከው ማነጻጸሪያ ጽንሰ-ሀሳቡን ግልጽ አድርጎታል። ይህንን ነጥብ በሚገባ ተቆጣጥረኸዋል።";
  } else if (words > 20) {
    score = 68;
    emotion = 'challenging';
    critique = "You defined the textbook rule, but why does this happen? Avoid reciting definitions — explain it using a concrete everyday scenario.";
    critiqueAmharic = "የመጽሐፉን ትርጓሜ ደገምከው እንጂ ለምን እንደተከሰተ አላስረዳኸኝም። በቀላል የዕለት ተዕለት ምሳሌ አብራራልኝ።";
  }

  return {
    score,
    passed,
    emotion,
    rootyCritique: critique,
    rootyCritiqueAmharic: critiqueAmharic,
    rubric: {
      simplicity: hasAnalogy ? 8 : 5,
      clarity: words > 20 ? 7 : 4,
      jargonAvoidance: hasAnalogy ? 8 : 5,
      analogyQuality: hasAnalogy ? 9 : 3,
      accuracy: 8
    },
    detectedJargon: ['thermal transfer', 'spontaneous', 'equilibrium'].filter(() => Math.random() > 0.4),
    followUpQuestion: `If the temperature or boundary condition changes suddenly, how would your explanation adjust?`,
    followUpQuestionAmharic: `የአካባቢው ሁኔታ በድንገት ቢቀየር፣ የሰጠኸው ማብራሪያ እንዴት ይለወጣል?`,
    praiseComment: hasAnalogy ? 'Great use of visual analogy!' : undefined
  };
}

function generateFallbackQuestions(topic: string, count: number) {
  return [
    {
      id: 'q_fb_1',
      question: `In the study of ${topic || 'Energy Transformations'}, which condition defines complete stability?`,
      questionAmharic: `በዚህ ጽንሰ-ሀሳብ ውስጥ ፍጹም ሚዛን (Equilibrium) የሚፈጠረው መቼ ነው?`,
      type: 'mcq',
      options: [
        'When entropy drops to zero perpetually',
        'When opposing forces or rates of transfer equalize net flux to zero',
        'When temperature reaches infinite value',
        'When mass is consumed without residue'
      ],
      optionsAmharic: [
        'ኢንትሮፒ ወደ ዜሮ ሲወርድ',
        'ተቃራኒ ኃይሎች ወይም ፍሰቶች እኩል ሆነው የተጣራ ለውጥ ዜሮ ሲሆን',
        'ቴምፕሬቸር ወሰን በሌለው መጠን ሲጨምር',
        'ምንም ቅሪት ሳይኖር ቁስ ሲጠፋ'
      ],
      correctIndex: 1,
      explanation: 'Dynamic equilibrium occurs when forward and reverse rates or potentials balance each other with zero net change.',
      explanationAmharic: 'ተቃራኒ ፍሰቶች እኩል ሲሆኑ እና የተጣራ ለውጥ በማይኖርበት ጊዜ ሚዛን ይፈጠራል።',
      difficulty: 'medium'
    }
  ];
}

// Vite middleware or static serving
async function startServer() {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Awde server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
