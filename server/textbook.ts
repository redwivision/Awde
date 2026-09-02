import { Type } from '@google/genai';
import { PDFParse, VerbosityLevel } from 'pdf-parse';
import { getGeminiClient, getGroqApiKey, getNvidiaApiKey, GROQ_BASE_URL, GROQ_TT_MODEL, NVIDIA_BASE_URL, NVIDIA_TT_MODEL } from './ai';

// Server-side pipeline that turns a real textbook PDF into an Awde mastery
// workspace: extract text -> send to Gemini -> shape into the same
// TextbookWorkspace structure the client persists. Falls back to a
// deterministic workspace when there is no API key, no extractable text, or
// Gemini is unavailable (offline / rate-limited), so the demo always proceeds.

const MAX_CHARS = 6000;
// AI free tiers can be slow, 503, or rate-limit. Cap each provider's wait so
// the demo falls back to the next provider / deterministic builder instead of
// hanging. 15s keeps a down-Gemini from stalling the whole chain.
const GEMINI_TIMEOUT_MS = 15000;

export interface ExtractedPdf {
  pages: number;
  text: string;
}

export async function extractPdfText(buffer: Buffer): Promise<ExtractedPdf> {
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    verbosity: VerbosityLevel.ERRORS
  });
  try {
    const result = await parser.getText();
    return {
      pages: result.pages?.length || 0,
      text: result.text || ''
    };
  } finally {
    try {
      await parser.destroy();
    } catch {
      /* ignore cleanup errors */
    }
  }
}

// Monotonic counter guarantees unique ids even for near-instant double uploads.
let textbookIdCounter = 0;

// Deterministic workspace builder (offline fallback). Mirrors the client-side
// createCustomTextbookWorkspace so a real-workflow demo still works without AI.
export function buildFallbackTextbookWorkspace(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedText: string
) {
  const bookId = `ai_book_${Date.now()}_${textbookIdCounter++}`;
  const firstUnitTitle = 'Unit 1: Core Concepts & Laws';
  const unitId = `${bookId}_unit_1`;

  const topicLines = (extractedText || '')
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(l)) // drop pdf-parse page separators
    .filter((l) => {
      const words = l.split(/\s+/);
      return words.length >= 2 && words.length <= 8;
    })
    .slice(0, 6);

  const topics =
    topicLines.length >= 2
      ? topicLines
      : ['Core Conceptual Foundations', 'Mechanisms & Governing Laws', 'Real-World Applications'];

  const nodes = topics.map((t, idx) => ({
    id: `${unitId}_node_${idx + 1}`,
    label: t,
    labelAmharic: `${t} (የተተነተነ ጽንሰ-ሀሳብ)`,
    category: idx === 0 ? ('Foundation' as const) : idx === 1 ? ('Core Law' as const) : ('Mechanism' as const),
    depthLevel: idx === 0 ? 1 : 2,
    masteryScore: 0,
    masteryStatus: 'unstudied' as const,
    summary: `Comprehensive cognitive breakdown of "${t}" extracted from ${bookTitle}.`,
    summaryAmharic: `ከቀረበው የመማሪያ መጽሐፍ የተዘጋጀ ማብራሪያ።`,
    keyFormulasOrRules: [`Core equation / invariant for ${t}`, 'Conservation and symmetry properties'],
    commonMisconceptions: [`Common beginner pitfall when analyzing ${t}.`],
    misconceptionsAmharic: ['በጥናት ወቅት የሚከሰቱ የተለመዱ ስህተቶች።'],
    localizedAnalogy: {
      title: `Ethiopian Real-World Analogy for ${t}`,
      titleAmharic: `የኢትዮጵያ ተግባራዊ ማነጻጸሪያ`,
      context: `Daily Ethiopian natural or cultural phenomenon reflecting ${t}.`,
      contextAmharic: `የዕለት ተዕለት ተግባር ማነጻጸሪያ።`,
      culturalElement: 'Ethiopian Everyday Life (የኢትዮጵያ ተሞክሮ)',
      explanation: `Visualizing ${t} through accessible physical intuition without abstract jargon.`,
      explanationAmharic: `ጽንሰ-ሀሳቡን በቀላል መንገድ መረዳት።`
    },
    prerequisites: idx > 0 ? [`${unitId}_node_${idx}`] : [],
    x: 200 + idx * 220,
    y: 120 + (idx % 2) * 80
  }));

  const connections = [];
  for (let i = 1; i < nodes.length; i++) {
    connections.push({
      id: `conn_${nodes[i - 1].id}_${nodes[i].id}`,
      from: nodes[i - 1].id,
      to: nodes[i].id,
      label: 'Prerequisite flow',
      relationType: 'depends_on' as const
    });
  }

  const unit = {
    id: unitId,
    title: firstUnitTitle,
    titleAmharic: 'ምዕራፍ 1፡ የተመሰረቱ ጽንሰ-ሀሳቦች',
    subject,
    subjectAmharic: subject,
    gradeOrLevel: gradeLevel,
    textbookSource: `${bookTitle} (${fileName})`,
    chapter: `Unit 1: ${firstUnitTitle}`,
    description: `Structured cognitive breakdown of ${bookTitle}.`,
    descriptionAmharic: `የ${bookTitle} የተሟላ ማይንድ-ማፕ እና የጥናት ዝግጅት።`,
    nodes,
    connections,
    quizQuestions: [
      {
        id: `quiz_${unitId}_1`,
        nodeId: nodes[0]?.id,
        question: `What is the core underlying mechanism governing ${nodes[0]?.label || firstUnitTitle}?`,
        type: 'mcq' as const,
        options: [
          'Fundamental conservation principles and state equilibrium',
          'Arbitrary historical convention without physical basis',
          'Random thermal fluctuations without predictable laws',
          'Static equilibrium only with zero dynamic transfer'
        ],
        correctIndex: 0,
        explanation: 'It is grounded in fundamental scientific conservation laws.',
        difficulty: 'medium' as const
      }
    ],
    flashcards: [
      {
        id: `fc_${unitId}_1`,
        nodeId: nodes[0]?.id,
        front: `Define the core principle of ${nodes[0]?.label || firstUnitTitle}.`,
        frontAmharic: `የ${nodes[0]?.label || firstUnitTitle} ዋና መርህ ምንድን ነው?`,
        back: `The fundamental law establishing predictable quantitative relationships in this unit.`,
        backAmharic: `በዚህ ምዕራፍ ውስጥ ያሉትን መርሆች የሚወስን መሠረታዊ ሕግ።`,
        boxLevel: 1,
        nextReviewDate: 'Today'
      }
    ],
    overallMastery: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };

  return {
    id: bookId,
    title: bookTitle,
    titleAmharic: bookTitle,
    subject,
    subjectAmharic: subject,
    gradeOrLevel: gradeLevel,
    sourcePdfName: fileName,
    coverColor: 'from-emerald-600 to-teal-900',
    totalUnits: 1,
    totalTopics: nodes.length,
    overallMastery: 0,
    lastStudiedAt: 'Just created',
    generatedByAI: false,
    units: [unit]
  };
}

// Real AI pipeline: Groq is the provider proven fastest+finishing on free tier
// today, so it is tried FIRST (Gemini/NVIDIA are slower or quota-limited right
// now). Falls through to each next provider, then the deterministic demo
// builder. Every provider gets its own timeout so the demo never hangs.
export async function buildAiTextbookWorkspace(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedText: string
) {
  if (getGroqApiKey()) {
    try {
      const unit = await groqBuildUnit(fileName, bookTitle, subject, gradeLevel, extractedText);
      return wrapMasteryUnit(unit, fileName, bookTitle, subject, gradeLevel, true, 'from-violet-600 to-indigo-900');
    } catch (err) {
      console.error('Groq textbook build failed, trying Gemini:', err instanceof Error ? err.message : err);
    }
  }

  if (getGeminiClient()) {
    try {
      const unit = await geminiBuildUnit(fileName, bookTitle, subject, gradeLevel, extractedText);
      return wrapMasteryUnit(unit, fileName, bookTitle, subject, gradeLevel, true, 'from-violet-600 to-indigo-900');
    } catch (err) {
      console.error('Gemini textbook build failed, trying NVIDIA NIM:', err instanceof Error ? err.message : err);
    }
  }

  if (getNvidiaApiKey()) {
    try {
      const unit = await nvidiaBuildUnit(fileName, bookTitle, subject, gradeLevel, extractedText);
      return wrapMasteryUnit(unit, fileName, bookTitle, subject, gradeLevel, true, 'from-violet-600 to-indigo-900');
    } catch (err) {
      console.error('NVIDIA NIM textbook build failed, falling back to demo:', err instanceof Error ? err.message : err);
    }
  }

  return { ...buildFallbackTextbookWorkspace(fileName, bookTitle, subject, gradeLevel, extractedText), generatedByAI: false };
}

async function geminiBuildUnit(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedText: string
) {
  const ai = getGeminiClient();
  const sample = extractedText.slice(0, MAX_CHARS) || bookTitle;

  const systemPrompt = `You are Awde's Master Textbook Architect.
Given an excerpt from a real STEM textbook, produce a focused, high-pedagogy mastery unit.
CRITICAL MANDATES:
1. Produce a unit of exactly 4 to 6 clearly differentiated ConceptNodes derived ONLY from the provided textbook content.
2. depthLevel: 1 = Core Foundation, 2 = Mechanism/Law, 3 = Real-world Application.
3. Every node MUST have BOTH English and rich Amharic fields.
4. Every node MUST include a localized, culturally Ethiopian analogy (Jebena Buna, Injera/Mitad, Merkato, Equb, GERD/Blue Nile, Addis Ababa Light Rail, Teff farming, Mesob weaving, Genna, etc.).
5. Include logical connections between nodes (depends_on, causes, contains, transforms_into) with coordinates x (150-750) and y (100-450).
6. Include 3-4 rigorous quiz questions (with Amharic options) and 2-3 flashcards grounded in the textbook content.
Output strictly valid JSON matching the schema.`;

  const prompt = `Transform this textbook (${bookTitle}, ${subject}, ${gradeLevel}) into an Awde mastery unit.
Textbook excerpt:
${sample}

Return the mastery unit as JSON.`;

  try {
    const response = await Promise.race([
      ai.models.generateContent({
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
            required: ['title', 'titleAmharic', 'nodes', 'connections', 'quizQuestions', 'flashcards']
          }
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini request timed out after 45s, falling back.')), GEMINI_TIMEOUT_MS)
      )
    ]);

    const parsed = JSON.parse((response as { text?: string }).text || '{}');
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    if (nodes.length === 0) {
      throw new Error('Gemini returned an empty node set.');
    }
    const nodesWithCoords = nodes.map((n: any, i: number) => ({
      ...n,
      masteryScore: 0,
      masteryStatus: 'unstudied',
      prerequisites: Array.isArray(n.prerequisites) ? n.prerequisites : [],
      x: typeof n.x === 'number' ? n.x : 200 + i * 150,
      y: typeof n.y === 'number' ? n.y : 120
    }));

    const unitId = `unit_${Date.now()}`;
    const unit = {
      id: unitId,
      title: parsed.title || 'Mastery Unit',
      titleAmharic: parsed.titleAmharic || parsed.title || 'የጥናት ክፍል',
      subject,
      subjectAmharic: subject,
      gradeOrLevel: gradeLevel,
      textbookSource: `${bookTitle} (${fileName})`,
      chapter: `Unit 1: ${parsed.title || 'Mastery Unit'}`,
      description: parsed.description || `Mastery breakdown of ${bookTitle}.`,
      descriptionAmharic: parsed.descriptionAmharic || `የ${bookTitle} የጥናት ዝግጅት።`,
      nodes: nodesWithCoords,
      connections: Array.isArray(parsed.connections) ? parsed.connections : [],
      quizQuestions: Array.isArray(parsed.quizQuestions) ? parsed.quizQuestions : [],
      flashcards: Array.isArray(parsed.flashcards) ? parsed.flashcards : [],
      overallMastery: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    return unit;
  } catch (err) {
    console.error('Gemini unit build failed:', err instanceof Error ? err.message : err);
    throw err;
  }
}

// Wrap a single mastery unit into a full TextbookWorkspace, regardless of
// which provider produced it. `generatedByAI` lets the client surface a small
// "AI generated" badge while the structural and quiz/flashcard fields stay
// identical to the deterministic demo builder.
function wrapMasteryUnit(
  unit: any,
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  generatedByAI: boolean,
  coverColor: string
) {
  return {
    id: `ai_book_${Date.now()}_${textbookIdCounter++}`,
    title: bookTitle,
    titleAmharic: bookTitle,
    subject,
    subjectAmharic: subject,
    gradeOrLevel: gradeLevel,
    sourcePdfName: fileName,
    coverColor,
    totalUnits: 1,
    totalTopics: unit.nodes?.length || 0,
    overallMastery: 0,
    lastStudiedAt: 'Just created',
    generatedByAI,
    units: [unit]
  };
}

// Shared OpenAI-compatible call (Groq and NVIDIA NIM both speak this shape).
// Returns the parsed JSON object or throws on non-2xx / invalid JSON, so the
// caller can fall through to the next provider. Uses plain fetch and the same
// timeout as Gemini so a slow/unavailable provider never blocks the demo.
async function postOpenAiCompatJson(
  baseUrl: string,
  model: string,
  apiKey: string,
  providerName: string,
  systemPrompt: string,
  prompt: string,
  maxTokens = 3000
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: maxTokens
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${providerName} HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as any;
    const msg = data?.choices?.[0]?.message || {};
    // NVIDIA NIM's gpt-oss-120b streams the answer into `reasoning` rather than
    // `content`, so check both. Cast because the plain-json lib types are loose.
    const raw = (msg.content || msg.reasoning || '{}') as string;
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  } finally {
    clearTimeout(timer);
  }
}

// Normalize whatever JSON a provider returned into a mastery unit, filling any
// missing coordinates/fields so the unit always matches the client schema.
function assembleUnit(
  json: any,
  provider: string,
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string
) {
  const nodes = Array.isArray(json?.nodes) ? json.nodes : [];
  if (nodes.length === 0) {
    throw new Error(`${provider} returned an empty node set.`);
  }
  const nodesWithCoords = nodes.map((n: any, i: number) => ({
    ...n,
    masteryScore: 0,
    masteryStatus: 'unstudied',
    prerequisites: Array.isArray(n.prerequisites) ? n.prerequisites : [],
    x: typeof n.x === 'number' ? n.x : 200 + i * 150,
    y: typeof n.y === 'number' ? n.y : 120
  }));

  const title = json.title || 'Mastery Unit';
  return {
    id: `unit_${Date.now()}_${provider}`,
    title,
    titleAmharic: json.titleAmharic || title || 'የጥናት ክፍል',
    subject,
    subjectAmharic: subject,
    gradeOrLevel: gradeLevel,
    textbookSource: `${bookTitle} (${fileName})`,
    chapter: `Unit 1: ${title}`,
    description: json.description || `Mastery breakdown of ${bookTitle}.`,
    descriptionAmharic: json.descriptionAmharic || `የ${bookTitle} የጥናት ዝግጅት።`,
    nodes: nodesWithCoords,
    connections: Array.isArray(json.connections) ? json.connections : [],
    quizQuestions: Array.isArray(json.quizQuestions) ? json.quizQuestions : [],
    flashcards: Array.isArray(json.flashcards) ? json.flashcards : [],
    overallMastery: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };
}

// Builds the system + user prompts shared by every OpenAI-compatible provider.
// The schema is deliberately COMPACT: free-tier token caps (especially Groq's
// TPM) are small, and a verbose schema eats the output budget. Shorter excerpts
// + terse field requests keep the completion under the cap so it isn't cut off.
function buildCompatPrompts(bookTitle: string, subject: string, gradeLevel: string, sample: string) {
  const systemPrompt = `You are Awde's textbook architect. Build a bilingual (English + Amharic) mastery unit for a student.
Output ONLY compact valid JSON, no markdown, no commentary. Rules:
- 4 nodes (label, labelAmharic, category, depthLevel, summary, localizedAnalogy{title,titleAmharic,culturalElement,explanation,explanationAmharic}, x, y)
- localizedAnalogy must be Ethiopian (Jebena/GERD/Injera/Merkato/Equb/Teff/Mesob/Genna/Light Rail)
- 3 connections (from,to,label,relationType)
- 2 quizQuestions (question,options,correctIndex,explanation)
- 2 flashcards (front,back)
Keep every field SHORT.`;

  const prompt = `Textbook: ${bookTitle} (${subject}, ${gradeLevel}). Excerpt:
${sample}

Return JSON: {"title":"...","titleAmharic":"...","nodes":[{...}], "connections":[...], "quizQuestions":[...], "flashcards":[...]}`;
  return { systemPrompt, prompt };
}

// Groq fallback: OpenAI-compatible chat-completions call that asks for the same
// structured mastery unit JSON. Uses plain fetch (no extra SDK dependency) and
// the same timeout so a slow/unavailable Groq never blocks the demo.
async function groqBuildUnit(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedText: string
) {
  const apiKey = getGroqApiKey();
  // Groq free tier enforces a small token budget per request, so send a SHORT
  // excerpt and direct the model to be concise - this keeps output from being
  // truncated at max_tokens. (Verified: 4 nodes complete; longer excerpts
  // exceed the cap and truncate mid-array.)
  const sample = extractedText.slice(0, 900) || bookTitle;
  const { systemPrompt, prompt } = buildCompatPrompts(bookTitle, subject, gradeLevel, sample);
  // qwen3.8-27b allows larger output than the shared 3000 default; allow more
  // headroom so the JSON completes.
  return postOpenAiCompatJson(
    GROQ_BASE_URL, GROQ_TT_MODEL, apiKey, 'Groq', systemPrompt, prompt, 5000
  ).then((json) => assembleUnit(json, 'groq', fileName, bookTitle, subject, gradeLevel));
}

// NVIDIA NIM fallback: same OpenAI-compatible shape, free-tier credit/RPM caps.
async function nvidiaBuildUnit(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedText: string
) {
  const apiKey = getNvidiaApiKey();
  const sample = extractedText.slice(0, 3000) || bookTitle;
  const { systemPrompt, prompt } = buildCompatPrompts(bookTitle, subject, gradeLevel, sample);
  const json = await postOpenAiCompatJson(
    NVIDIA_BASE_URL, NVIDIA_TT_MODEL, apiKey, 'NVIDIA NIM', systemPrompt, prompt
  );
  return assembleUnit(json, 'nvidia', fileName, bookTitle, subject, gradeLevel);
}

// Process a real PDF buffer into a TextbookWorkspace, trying Gemini first.
export async function processTextbookPdf(
  buffer: Buffer,
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string
) {
  const extracted = await extractPdfText(buffer);
  return {
    workspace: await buildAiTextbookWorkspace(fileName, bookTitle, subject, gradeLevel, extracted.text || ''),
    extractedPages: extracted.pages,
    textLength: (extracted.text || '').length
  };
}