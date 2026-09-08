import { PDFParse, VerbosityLevel } from 'pdf-parse';
import { callAiWithFallback } from './providerRouter';

// Server-side pipeline that turns a real textbook PDF into an Awde mastery
// workspace: extract text -> send through the shared provider router
// (OpenRouter → Groq → NVIDIA) -> shape into the same TextbookWorkspace
// structure the client persists. Falls back to a deterministic workspace when
// there is no API key, no extractable text, or every provider is unavailable
// (offline / rate-limited), so the demo always proceeds.

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

// A deterministic builder must never fabricate formulas it can't know. It only
// surfaces a formula when the topic label itself already spells one out; for a
// formula-less concept the drawer's empty state ("more about words than
// numbers") is the honest answer rather than fake placeholder text.
const FORMULA_MARKER = /(\bF\s*=\s*|=\s*|\bE\s*=\s*|\bV\s*=\s*|\bPV\s*=|Nernst|Δ|\bW\s*=\s*|\bQ\s*=\s*|\bP\s*=\s*)/i;
function extractKnownFormulas(topicLabel: string): string[] {
  const cleaned = topicLabel.replace(/\s+/g, ' ').trim();
  if (FORMULA_MARKER.test(cleaned)) return [cleaned];
  return [];
}

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
    summary: `${t} is best understood step by step: what it is, how it behaves, and one everyday example that makes it concrete.`,
    summaryAmharic: `${t}ን ደረጃ በደረጃ መረዳት አለብህ፡ ምን እንደሆነ፣ እንዴት እንደሚሰራ፣ እና አንድ የዕለት ተዕለት ምሳሌ።`,
    detailedExplanation: `This is the concept "${t}". It was introduced in the textbook but we could not generate a full AI explanation right now (offline or no AI key). It stands in the book on its own, so the most reliable source for this node is the textbook itself. Use "Ask Rooty" for a plain-language walkthrough, or reconnect for a live AI explanation.`,
    detailedExplanationAmharic: `ይህ "${t}" የተባለ ጽንሰ-ሀሳብ ነው። አሁን ሙሉ ማብራሪያ ማመንጨት አልተቻለም (AI አገልግሎት ስለሌለ ወይም ከመስመር ውጭ ስለሆነ)። ትክክለኛው ምንጭ መጽሐፉ ራሱ ነው። "ሩቲን ጠይቅ" ተጠቀም ወይም በመስመር ተመልሰህ ሙሉ ማብራሪያ እንደገና ለማግኘት።`,
    keyTakeaways: ['Start from the textbook\u2019s own definition of this node.', 'Ask Rooty for a simple, jargon-free explanation.', 'Reconnect to generate a full AI explanation with cultural analogy.'],
    keyTakeawaysAmharic: ['ይህንን ጽንሰ-ሀሳብ ከመጽሐፉ ራሱ ጀምር።', 'ለቀላል ማብራሪያ ሩቲን ጠይቅ።', 'ሙሉ የAI ማብራሪያ ለማግኘት በመስመር ተመለስ።'],
    keyFormulasOrRules: extractKnownFormulas(t),
    commonMisconceptions: ['Confusing this node with a neighboring topic in the same chapter.', 'Assuming the summary alone gives the whole picture \u2014 read the textbook section.'],
    misconceptionsAmharic: ['ይህንን ጽንሰ-ሀሳብ ከሌላ ተመሳሳይ ርዕስ ጋር ማምታታት።', 'ማጠቃለያው ብቻ በቂ ነው ብሎ ማሰብ።'],
    localizedAnalogy: {
      title: 'Study it like a real explanation',
      titleAmharic: 'እንደ እውነተኛ ማብራሪያ ተማር',
      context: 'No cultural analogy available yet \u2014 this node is awaiting an AI explanation.',
      contextAmharic: 'ገና ምሳሌ አልተገኘም — ይህ ጽንሰ-ሀሳብ የAI ማብራሪያ ይጠብቃል።',
      culturalElement: 'Ready for a real analogy',
      explanation: 'A proper Ethiopian cultural analogy will appear here once we generate a live explanation. For now, open the textbook section and ask Rooty to help you make sense of it.',
      explanationAmharic: 'የኢትዮጵያ ምሳሌ ወደፊት እዚህ ይታያል። እስከዚያ ድረስ መጽሐፉን ከፍተህ ሩቲን ለመረዳት ጠይቅ።'
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

// Real AI pipeline: whole answer goes through the shared provider router
// (OpenRouter → Groq → NVIDIA) with its per-provider timeouts, circuit breaker
// and overall chain deadline, then the deterministic demo builder as last
// resort. `provider` is null exactly when the demo builder ran, so callers can
// surface a "generated by AI" badge and know whether to cache.
export async function buildAiTextbookWorkspace(
  fileName: string,
  bookTitle: string,
  subject: string,
  gradeLevel: string,
  extractedText: string
) {
  // Sample kept modest: free-tier token caps (especially Groq) are small and a
  // verbose excerpt eats the completion budget — the compact prompt asks the
  // model to keep every field SHORT so the JSON finishes under max_tokens.
  const sample = extractedText.slice(0, 2000) || bookTitle;
  const { systemPrompt, prompt } = buildCompatPrompts(bookTitle, subject, gradeLevel, sample);
  const { data, provider } = await callAiWithFallback({
    label: 'textbook',
    systemPrompt,
    prompt,
    maxTokens: 5000,
    fallback: () => buildFallbackTextbookWorkspace(fileName, bookTitle, subject, gradeLevel, extractedText)
  });
  if (!provider) return data;
  const unit = assembleUnit(data, provider, fileName, bookTitle, subject, gradeLevel);
  return wrapMasteryUnit(unit, fileName, bookTitle, subject, gradeLevel, true, 'from-violet-600 to-indigo-900');
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
    keyFormulasOrRules: Array.isArray(n.keyFormulasOrRules) ? n.keyFormulasOrRules : [],
    commonMisconceptions: Array.isArray(n.commonMisconceptions) ? n.commonMisconceptions : [],
    keyTakeaways: Array.isArray(n.keyTakeaways) ? n.keyTakeaways : [],
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
- 4 nodes (label, labelAmharic, category, depthLevel, summary, summaryAmharic, detailedExplanation, detailedExplanationAmharic, keyTakeaways, keyTakeawaysAmharic, commonMisconceptions, misconceptionsAmharic, keyFormulasOrRules, localizedAnalogy{title,titleAmharic,culturalElement,context,explanation,explanationAmharic}, x, y)
- localizedAnalogy must be Ethiopian (Jebena/GERD/Injera/Merkato/Equb/Teff/Mesob/Genna/Light Rail)
- detailedExplanation: a real plain-language explanation of the idea, at most 2 short sentences, ZERO jargon; if the topic has a formula, write keyFormulasOrRules as actual math (e.g. "F = m * a"), otherwise leave keyFormulasOrRules as an empty array []. Never invent placeholder text.
- 3 connections (from,to,label,relationType)
- 2 quizQuestions (question,options,correctIndex,explanation)
- 2 flashcards (front,back)
Keep every field SHORT and concrete — no boilerplate like "core underlying principle".`;

  const prompt = `Textbook: ${bookTitle} (${subject}, ${gradeLevel}). Excerpt:
${sample}

Return JSON: {"title":"...","titleAmharic":"...","nodes":[{...}], "connections":[...], "quizQuestions":[...], "flashcards":[...]}`;
  return { systemPrompt, prompt };
}

// Process a real PDF buffer into a TextbookWorkspace through the shared
// provider router (OpenRouter → Groq → NVIDIA), falling back to the
// deterministic demo builder on any failure.
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