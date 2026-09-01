export type LanguageMode = 'en' | 'am';

export type DesignAesthetic =
  | 'slate-dark'
  | 'scholar-light'
  | 'nordic-light'
  | 'obsidian-dark'
  | 'terracotta-warm';

export interface AestheticTheme {
  id: DesignAesthetic;
  name: string;
  nameAmharic: string;
  tagline: string;
  taglineAmharic: string;
  mode: 'dark' | 'light';
  palette: {
    bg: string;
    card: string;
    border: string;
    accent: string;
    text: string;
    textMuted: string;
  };
}

export type RootyEmotion =
  | 'neutral'
  | 'skeptical'
  | 'confused'
  | 'stern'
  | 'intrigued'
  | 'convinced'
  | 'proud'
  | 'challenging';

export type MasteryStatus = 'unstudied' | 'learning' | 'feynman_tested' | 'mastered';

export type NodeCategory =
  | 'Foundation'
  | 'Mechanism'
  | 'Core Law'
  | 'Real-World App'
  | 'Edge Case'
  | 'Formula & Math';

export interface LocalizedAnalogy {
  title: string;
  titleAmharic: string;
  context: string;
  contextAmharic: string;
  explanation: string;
  explanationAmharic: string;
  culturalElement: string; // e.g., 'Jebena Buna Ceremony', 'Injera Fermentation', 'Merkato Trade', 'Abay Gorge'
}

export interface ConceptNode {
  id: string;
  label: string;
  labelAmharic: string;
  category: NodeCategory;
  depthLevel: number; // 1 (Core topic), 2 (Key branch), 3 (Detail/application)
  masteryScore: number; // 0 to 100
  masteryStatus: MasteryStatus;
  summary: string;
  summaryAmharic: string;
  keyFormulasOrRules: string[];
  commonMisconceptions: string[];
  misconceptionsAmharic?: string[];
  localizedAnalogy: LocalizedAnalogy;
  prerequisites: string[]; // Node IDs
  x: number;
  y: number;
}

export interface NodeConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  labelAmharic?: string;
  relationType: 'depends_on' | 'causes' | 'contains' | 'contrasts' | 'transforms_into';
}

export interface QuizQuestion {
  id: string;
  nodeId?: string;
  nodeLabel?: string;
  question: string;
  questionAmharic?: string;
  type: 'mcq' | 'scenario' | 'misconception' | 'short_answer';
  options: string[];
  optionsAmharic?: string[];
  correctIndex: number;
  explanation: string;
  explanationAmharic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Flashcard {
  id: string;
  nodeId: string;
  front: string;
  frontAmharic: string;
  back: string;
  backAmharic: string;
  boxLevel: number; // 1 to 5 (Leitner system)
  nextReviewDate: string;
}

export interface FeynmanDialogueTurn {
  id: string;
  speaker: 'user' | 'rooty';
  text: string;
  emotion?: RootyEmotion;
  timestamp: number;
  jargonDetected?: string[];
  scoreSnapshot?: number;
}

export interface FeynmanEvaluation {
  nodeId: string;
  nodeLabel: string;
  score: number; // 0 - 100
  passed: boolean;
  emotion: RootyEmotion;
  rootyCritique: string;
  rootyCritiqueAmharic: string;
  rubric: {
    simplicity: number; // 0 - 10
    clarity: number; // 0 - 10
    jargonAvoidance: number; // 0 - 10
    analogyQuality: number; // 0 - 10
    accuracy: number; // 0 - 10
  };
  detectedJargon: string[];
  followUpQuestion: string;
  followUpQuestionAmharic: string;
  praiseComment?: string;
}

export interface TopicUnit {
  id: string;
  title: string;
  titleAmharic: string;
  subject: string;
  subjectAmharic: string;
  gradeOrLevel: string;
  textbookSource: string;
  chapter: string;
  description: string;
  descriptionAmharic: string;
  nodes: ConceptNode[];
  connections: NodeConnection[];
  quizQuestions: QuizQuestion[];
  flashcards: Flashcard[];
  overallMastery: number; // 0 to 100
  createdAt: string;
}

export type StudyMethod =
  | 'feynman'
  | 'mindmap'
  | 'active_quiz'
  | 'blurting'
  | 'flashcard'
  | 'hybrid_map_feynman'
  | 'hybrid_feynman_quiz';

export interface MethodExperimentLog {
  id: string;
  timestamp: number;
  dateStr: string;
  nodeId: string;
  nodeTitle: string;
  unitId: string;
  unitTitle: string;
  methodsUsed: StudyMethod[];
  preConfidence: number; // 1-5
  preRecallScore: number; // 0-100%
  postRecallScore: number; // 0-100%
  deltaPercent: number; // e.g. +55%
  timeSpentSeconds: number;
  jargonEliminatedCount: number;
  retentionRating: 'Super Synergy' | 'High Retention' | 'Moderate' | 'Needs Reinforcement';
  notes?: string;
}

export interface BlurtingRecallResult {
  accuracyScore: number;
  recalledKeyPoints: string[];
  missedKeyPoints: string[];
  feedback: string;
  feedbackAmharic: string;
}

export type ActiveTab =
  | 'home'
  | 'mindmap'
  | 'feynman'
  | 'quiz'
  | 'studysuite'
  | 'experiment_lab'
  | 'library';

export interface TextbookWorkspace {
  id: string;
  title: string;
  titleAmharic: string;
  subject: string;
  subjectAmharic: string;
  gradeOrLevel: string;
  sourcePdfName?: string;
  coverColor: string; // Tailwind gradient / color identifier
  totalUnits: number;
  totalTopics: number;
  overallMastery: number; // 0-100
  lastStudiedAt: string;
  units: TopicUnit[];
}
