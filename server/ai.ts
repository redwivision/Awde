import { GoogleGenAI, Type } from '@google/genai';

// Lazy init Gemini SDK. Returns null when no API key is configured, in which
// case every AI endpoint falls back to a deterministic offline generator.
export function getGeminiClient(): GoogleGenAI | null {
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

// Groq (OpenAI-compatible, fast LPU inference) used as a fallback provider when
// Gemini is unavailable or overloaded. Optional via GROQ_API_KEY; returns null
// when not configured so the pipeline skips straight to the demo builder.
export function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

// The Groq chat-completions endpoint (OpenAI-compatible). Kept as a constant so
// textbook.ts can call it with plain fetch and no extra SDK dependency.
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
// qwen3.8-27b has a far larger free-tier token allowance than the gpt-oss
// models, so it reliably completes the full mastery-unit JSON without
// truncation (verified: 4 nodes + quiz + flashcards, ~3s, finish=stop).
export const GROQ_TT_MODEL = 'qwen/qwen3.8-27b';

// NVIDIA NIM: free-tier OpenAI-compatible gateway (build.nvidia.com, 40 RPM).
// Another optional fallback provider between Gemini and Groq.
export function getNvidiaApiKey(): string | null {
  return process.env.NVIDIA_API_KEY || null;
}
export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
// Only model currently enabled+callable on this account (verified: others 404).
// Note: NVIDIA free tier is very slow for large outputs - may time out.
export const NVIDIA_TT_MODEL = 'minimaxai/minimax-m3';

// How long an upstream AI call (Gemini) is allowed to run before we give up and
// fall back to the deterministic generator. Kept short so weak-wifi students get
// a usable answer fast instead of a stuck spinner or a 5xx error.
export const AI_TIMEOUT_MS = 9000;

// Wraps a promise with an absolute deadline. If the promise doesn't settle in
// `ms`, it rejects with a sentinel AiTimeoutError. Combined with each route's
// fallback handler, this guarantees an AI endpoint NEVER hangs or 500s on a
// slow/failed upstream — it falls back deterministically.
export class AiTimeoutError extends Error {
  constructor() {
    super('ai_timeout');
    this.name = 'AiTimeoutError';
  }
}

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AiTimeoutError()), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Deterministic offline fallback generators. These run instantly with zero
// network, so weak-wifi / offline students always get a working experience.
// They power every AI feature until a GEMINI_API_KEY is configured.

// Monotonic counter guarantees unique ids even when two units are created
// within the same millisecond (prevents localStorage key collisions).
let unitIdCounter = 0;

export function generateFallbackUnit(topic?: string | null, subject?: string | null, text?: string | null) {
  const topicTitle = topic || 'Organic Chemistry: Hydrocarbons & Reactions';
  unitIdCounter += 1;
  return {
    id: 'unit_gen_' + Date.now() + '_' + unitIdCounter,
    title: topicTitle,
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
        detailedExplanation: 'Carbon is unique among elements because its 2s and 2p orbitals can mix (hybridize) in three distinct ways. In sp3 hybridization, one s and three p orbitals blend into four equivalent orbitals arranged in a tetrahedron at 109.5°, as seen in methane (CH4). In sp2 hybridization, one s and two p orbitals form three planar orbitals at 120° with one leftover p orbital that creates a pi bond, as in ethene (C2H4). In sp hybridization, one s and one p orbital form two linear orbitals at 180°, leaving two p orbitals for pi bonding, as in ethyne (C2H2). The geometry dictated by hybridization determines molecular shape, bond angles, and reactivity.',
        detailedExplanationAmharic: 'ካርቦን በ轨道 ልውውጥ ልዩ ነው። sp3 ሃይብሪዳይዜሽን ውስጥ አንድ s እና ሦስት p ቦንዶች በ109.5° በክብብ የተቀመጡ አራት እኩል ቦንዶችን ይፈጥራሉ። sp2 ላይ ሦስት የፍላት ቦንዶች በ120° ይሆኑና አንድ ተቀሪ p ቦንድ ፓይ ቦንድ ይፈጥራል። sp ላይ ሁለት ቀጥታ ቦንዶች በ180° ይሆኑና ሁለት ተቀሪ p ቦንዶች ፓይ ቦንዶችን ይፈጥራሉ።',
        keyTakeaways: [
          'Carbon can form four bonds because it has four valence electrons.',
          'sp3 = tetrahedral (109.5°), sp2 = trigonal planar (120°), sp = linear (180°).',
          'Hybridization determines molecular geometry and bond angles.',
          'Pi bonds form from unhybridized p orbitals and are weaker than sigma bonds.'
        ],
        keyTakeawaysAmharic: [
          'ካርቦን አራት የቫለንስ ኤሌክትሮኖች ስላለው አራት ቦንዶችን ይሰራል።',
          'sp3 = ትትራACHEDRAL (109.5°), sp2 = TRIGONAL PLANAR (120°), sp = LINEAR (180°)።',
          'ሃይብሪዳይዜሽን የሞለኪውል ቅርጽን እና የቦንድ አንግሎችን ይወስናል።',
          'ፓይ ቦንዶች ከተቀሩ p ቦንዶች ይፈጥራሉ ከሲግማ ቦንዶችም ደካማ ናቸው።'
        ],
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
        detailedExplanation: 'Hydrocarbons are classified by the types of carbon-carbon bonds they contain. Alkanes are saturated — every carbon is bonded to the maximum number of hydrogens via single sigma bonds, making them relatively unreactive. Alkenes contain at least one C=C double bond (one sigma + one pi bond), and the pi bond is a region of high electron density that readily undergoes addition reactions. Alkynes contain C≡C triple bonds (one sigma + two pi bonds), making them even more electron-rich and reactive. The general formulas CnH2n+2 (alkanes), CnH2n (alkenes), and CnH2n-2 (alkynes) let you determine the degree of unsaturation from the molecular formula alone.',
        detailedExplanationAmharic: 'ሃይድሮካርቦኖች በነጠላ፣ ድርብ እና ባለ ሶስት ቦንዶች ይ猬分裂። አልኬኖች ነጠላ ቦንዶች ብቻ አላቸው፣ አልኪኖች ድርብ ቦንድ አላቸው፥ አልካይኖች ግን ባለ ሶስት ቦንድ አላቸው።',
        keyTakeaways: [
          'Alkanes (single bonds) are saturated and relatively unreactive.',
          'Alkenes (double bonds) and alkynes (triple bonds) are unsaturated and more reactive.',
          'The pi bond in alkenes/alkynes is the reactive site for addition reactions.',
          'Use CnH2n+2, CnH2n, CnH2n-2 to identify the hydrocarbon type from its formula.'
        ],
        keyTakeawaysAmharic: [
          'አልኬኖች (ነጠላ ቦንድ) ያልጠገቡ እና ዝህረት ያላቸው ናቸው።',
          'አልኪኖች (ድርብ ቦንድ) እና አልካይኖች (ባለ ሶስት ቦንድ) የተገነባ አልሆኑ እና በጣም ፈጣን ምላሽ ይሰጣሉ።',
          'ፓይ ቦንድ በአልኪኖች/አልካይኖች ውስጥ ለመደመር ምላሽ ቦታ ነው።',
          'CnH2n+2, CnH2n, CnH2n-2 በቀላል ፎርሙላ ሃይድሮካርቦን ዓይነቱን ይወስናሉ።'
        ],
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
        detailedExplanation: 'Addition reactions occur when a molecule adds across a double or triple bond. The pi bond breaks and two new sigma bonds form. In electrophilic addition (the most common type), an electrophile attacks the electron-rich pi bond first. For example, adding HBr to propene follows Markovnikov\'s rule: hydrogen attaches to the carbon with more hydrogens, and bromine goes to the more substituted carbon. Substitution reactions, by contrast, involve replacing one atom or group with another. In free-radical substitution of alkanes, a hydrogen is replaced by a halogen under UV light. The key distinction: addition increases the number of bonds to carbon, while substitution swaps one for another.',
        detailedExplanationAmharic: 'የመደመር ምላሽ ማለት ድርብ ቦንድ በመስበር አዳዲስ ቦንዶችን መጨመር ነው። በ марковников ሕግ መሰረት ሃይድሮጅን ብዙ ሃይድሮጅን ወዳለው ካርቦን ይጣመራል። የመተካካት ምላሽ ግን አንድን አተም በሌላ መተካት ነው።',
        keyTakeaways: [
          'Addition reactions break pi bonds to add new atoms across a double/triple bond.',
          'Markovnikov\'s rule: H adds to the carbon with more hydrogens already attached.',
          'Substitution replaces one atom/group with another without changing the bond count.',
          'UV light triggers free-radical substitution in alkanes.'
        ],
        keyTakeawaysAmharic: [
          'የመደመር ምላሽ ፓይ ቦንዶችን በመስበር አዳዲስ አተሞችን ያክላል።',
          'ማርኮቭኒክ岡 ሕግ: ሃይድሮጅን ብዙ ሃይድሮጅን ወዳለው ካርቦን ይጣመራል።',
          'የመተካካት ምላሽ አንድን አተም በሌላ ይቀይራል ቦንድ ብዛት እንዳይቀይር።',
          'የ	uv ብርሃን በአልኬኖች ውስጥ የነጠላ ቦንድ መተካካት ያሰማርላል።'
        ],
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

const ANALOGY_RE = /like|as if|similar to|imagine|ለምሳሌ|ልክ እንደ|እንደ/i;
const JARGON_CATALOG = ['thermal transfer', 'spontaneous', 'equilibrium'];

function buildDetectedJargon(text: string): string[] {
  const normalized = text.toLowerCase();
  return JARGON_CATALOG.filter((term) => normalized.includes(term) || normalized.includes(term.replace(/\s+/g, '')));
}

export function generateFallbackFeynmanEvaluation(
  nodeLabel?: string | null,
  explanation?: string | null,
  strictness?: string | null
) {
  const text = explanation || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const hasAnalogy = ANALOGY_RE.test(text);
  const tooShort = words < 12;
  const summarizedJargon = buildDetectedJargon(text);

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
    detectedJargon: summarizedJargon,
    followUpQuestion: `If the temperature or boundary condition changes suddenly, how would your explanation adjust?`,
    followUpQuestionAmharic: `የአካባቢው ሁኔታ በድንገት ቢቀየር፣ የሰጠኸው ማብራሪያ እንዴት ይለወጣል?`,
    praiseComment: hasAnalogy ? 'Great use of visual analogy!' : undefined
  };
}

export function generateFallbackQuestions(topic?: string | null, count?: number | null) {
  const topicTitle = topic || 'Energy Transformations';
  const n = Math.max(1, Math.min(20, Number(count) || 1));
  const questions = [];
  for (let i = 0; i < n; i++) {
    questions.push({
      id: `q_fb_${i + 1}`,
      question: `In the study of ${topicTitle}, which condition defines complete stability?`,
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
    });
  }
  return questions;
}

export function generateFallbackBlurting(targetKeyPoints?: string[] | null) {
  const keys = Array.isArray(targetKeyPoints) ? targetKeyPoints : [];
  return {
    accuracyScore: 78,
    recalledKeyPoints: keys.slice(0, 2),
    missedKeyPoints: keys.slice(2),
    feedback: 'Good recall of initial principles. Ensure you capture boundary limits and energy transfers.',
    feedbackAmharic: 'የመነሻ መርሆችን በጥሩ ሁኔታ አስታውሰሃል። የቀሩትን የጉልበት ዝውውር ነጥቦች ደግመህ ተመልከት።'
  };
}

export function generateFallbackNodeAnswer(
  nodeLabel?: string | null,
  question?: string | null
) {
  const label = nodeLabel || 'this concept';
  const q = (question || '').toLowerCase();
  let answer: string;
  let answerAmharic: string;

  if (q.includes('why') || q.includes('ምን') || q.includes('ለምን')) {
    answer = `Great question! The reason "${label}" works the way it does comes down to fundamental physical principles. Think of it like this: just as water flows downhill because of gravity, ${label} follows its own governing rule. The key insight is that energy and structure determine behavior — change one, and the other shifts too. Try connecting this to a real-world Ethiopian example, like how the Blue Nile carves the Abay Gorge over millennia.`;
    answerAmharic = `ጥሩ ጥያቄ ነው! «${label}» እንዴት እንደሚሠራ በመሠረታዊ የፊዚክስ መርሆች ሊብራራ ይችላል። ውሃ በስበት ኃይል ወደ ታች እንደሚፈስ ሁሉ፣ ${label} የራሱን ሕግ ይከተላል። ቁልፉ ነገር ሃይል እና አወቃቀር ባህሪን እንደሚወስኑ መረዳት ነው። ለምሳሌ የግድግዳን ጅልን ከብሉ ናይል ጋር በማገናኘት ልታስተካክለው ትችላለህ።`;
  } else if (q.includes('example') || q.includes('ምሳሌ') || q.includes('how')) {
    answer = `Here's a concrete way to think about "${label}": imagine you're at Merkato watching a busy trade happen. The same transfer principle applies here — one thing changes state or position, and the outcome depends on the conditions. The most important thing to remember is that ${label} isn't abstract — it shows up in daily Ethiopian life, from coffee roasting (Jebena Buna) to building bridges and dams.`;
    answerAmharic = `«${label}»ን ለማሰብ እንዲህ አስቡት፡ በመርካቶ ውስጥ ንግድ ሲከሰት እንደሚታየው ነው። ተመሳሳይ የለውጥ መርህ ይተገበራል — አንድ ነገር ሁኔታውን ሲቀይር ውጤቱ በዙሪያው ባሉ ሁኔታዎች ላይ ይወሰናል።`;
  } else {
    answer = `"${label}" is a core concept that connects to several other ideas in this unit. The essential thing to understand is that it describes a real physical process — not just a formula on paper. Rooty recommends: try explaining it to a younger sibling using only everyday words and a Ethiopian cultural analogy. If you can do that, you truly understand it!`;
    answerAmharic = `«${label}» ከዚህ ክፍል ውስጥ ካሉ ሌሎች ሃሳቦች ጋር የሚገናኝ ዋና ጽንሰ-ሀሳብ ነው። ሊረዳበት የሚገባው ዋናው ነገር በውስጡ ያለውን ትክክለኛ የፊዚካል ሂደት መረዳት ነው — በወረቀት ላይ ባለ ቀመር ብቻ አይደለም። ሩቲ ይመክራል፡ ለትንሽ ልጅ በቀላል የዕለት ተዕለት ቃላት እና በኢትዮጵያዊ ምሳሌ ለማስተማር ሞክር።`;
  }

  return { answer, answerAmharic };
}

// The schema shared by every Gemini call (documented in server.ts). Kept here
// so offline fallbacks and live responses stay shape-compatible.
export const GeminiSchema = { Type };