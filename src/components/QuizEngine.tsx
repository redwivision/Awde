import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { postJson } from '../lib/api';
import {
  LanguageMode,
  QuizQuestion,
  TopicUnit
} from '../types';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  Zap,
  ArrowRight,
  BookOpen,
  Filter,
  Layers,
  ChevronRight,
  Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizEngineProps {
  unit: TopicUnit;
  language: LanguageMode;
  onAddCustomQuestions?: (questions: QuizQuestion[]) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  unit,
  language,
  onAddCustomQuestions
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(unit.quizQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  const isAmharic = language === 'am';

  const activeQuestions = questions.filter(
    (q) => filterDifficulty === 'all' || q.difficulty === filterDifficulty
  );

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // already answered
    const updated = { ...selectedAnswers, [currentIndex]: optIndex };
    setSelectedAnswers(updated);
    setShowExplanation(true);

    if (optIndex === currentQ.correctIndex) {
      // gentle reward
    }
  };

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowExplanation(selectedAnswers[currentIndex + 1] !== undefined);
    } else {
      setIsCompleted(true);
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 }
      });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowExplanation(selectedAnswers[currentIndex - 1] !== undefined);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowExplanation(false);
    setIsCompleted(false);
  };

  const handleGenerateMoreQuestions = async () => {
    setIsGeneratingMore(true);
try {
      const res = await postJson('/api/quiz/generate', {
        topic: unit.title,
        textbookText: unit.description,
        count: 4,
        difficulty: 'hard'
      });
      const data = res.data as { success?: boolean; questions?: QuizQuestion[] };
      if (data.success && data.questions) {
        const newQs: QuizQuestion[] = data.questions;
        setQuestions((prev) => [...prev, ...newQs]);
        if (onAddCustomQuestions) onAddCustomQuestions(newQs);
      }
    } catch (e) {
      console.error('Failed to generate extra quiz:', e);
    } finally {
      setIsGeneratingMore(false);
    }
  };

  // Score stats
  const totalAnswered = Object.keys(selectedAnswers).length;
  const correctCount = activeQuestions.reduce((acc, q, idx) => {
    return selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc;
  }, 0);
  const scorePercent = totalAnswered > 0 ? Math.round((correctCount / activeQuestions.length) * 100) : 0;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto" id="quiz-lab-view">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header Title & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-semibold">
                Textbook Diagnostic Lab
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {unit.subject} • {unit.gradeOrLevel}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isAmharic ? unit.titleAmharic : unit.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateMoreQuestions}
              disabled={isGeneratingMore}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{isGeneratingMore ? 'Generating AI Questions...' : 'Generate 4 More Questions'}</span>
            </button>
          </div>
        </div>

        {!isCompleted && currentQ ? (
          <div className="space-y-6">
            {/* Progress & Question Tracker */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">
                {isAmharic ? 'ጥያቄ' : 'Question'} {currentIndex + 1} / {activeQuestions.length}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="capitalize px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  {currentQ.difficulty}
                </span>
                {currentQ.nodeLabel && (
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[11px] truncate max-w-[200px]">
                    {currentQ.nodeLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                className="h-full bg-emerald-500 transition-all duration-300"
              />
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQ.id || currentIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6"
            >
              <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
                {isAmharic && currentQ.questionAmharic ? currentQ.questionAmharic : currentQ.question}
              </h3>
              {isAmharic && currentQ.questionAmharic && (
                <p className="text-xs text-slate-400 font-mono">
                  {currentQ.question}
                </p>
              )}

              {/* Options Grid */}
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const optAmharic = currentQ.optionsAmharic?.[optIdx];
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const isAnswered = selectedAnswers[currentIndex] !== undefined;
                  const isCorrect = optIdx === currentQ.correctIndex;

                  let cardStyle = 'bg-slate-950/70 border-slate-800 hover:border-slate-600 text-slate-200';
                  if (isAnswered) {
                    if (isCorrect) {
                      cardStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-100 font-semibold';
                    } else if (isSelected) {
                      cardStyle = 'bg-rose-950/60 border-rose-500 text-rose-100 font-semibold';
                    } else {
                      cardStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <div>
                          <p className="text-sm">
                            {isAmharic && optAmharic ? optAmharic : opt}
                          </p>
                          {isAmharic && optAmharic && (
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {opt}
                            </p>
                          )}
                        </div>
                      </div>

                      {isAnswered && (
                        <div>
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : isSelected ? (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          ) : null}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step-by-Step Misconception Explanation Banner */}
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-sm leading-relaxed"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    <span>{isAmharic ? 'የመልስ ማብራሪያ እና ፅንሰ-ሀሳብ' : 'Pedagogical Solution & Diagnostic'}</span>
                  </div>
                  <p className="text-slate-200">
                    {isAmharic && currentQ.explanationAmharic ? currentQ.explanationAmharic : currentQ.explanation}
                  </p>
                  {isAmharic && currentQ.explanationAmharic && (
                    <p className="text-xs text-slate-400 pt-1 border-t border-slate-900 font-mono">
                      <strong>EN:</strong> {currentQ.explanation}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 text-xs font-semibold"
                >
                  {isAmharic ? '← ወደ ኋላ' : '← Previous'}
                </button>

                <button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentIndex] === undefined}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
                >
                  <span>
                    {currentIndex === activeQuestions.length - 1
                      ? isAmharic ? 'ውጤት እይ' : 'Finish Quiz'
                      : isAmharic ? 'ቀጣይ ጥያቄ →' : 'Next Question →'}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        ) : isCompleted ? (
          /* Completion Summary Dashboard */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 mx-auto flex items-center justify-center">
              <Award className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {isAmharic ? 'የፈተናው ማጠቃለያ!' : 'Quiz Assessment Complete!'}
              </h3>
              <p className="text-sm text-slate-400">
                {isAmharic
                  ? `ከ ${activeQuestions.length} ጥያቄዎች ${correctCount}ቱን በትክክል መልሰሃል።`
                  : `You scored ${correctCount} out of ${activeQuestions.length} correctly (${scorePercent}%).`}
              </p>
            </div>

            {/* Score Ring */}
            <div className="p-4 rounded-xl bg-slate-950 max-w-xs mx-auto border border-slate-800 flex items-center justify-around">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Mastery Level</span>
                <p className="text-xl font-extrabold text-emerald-400">{scorePercent}%</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Accuracy</span>
                <p className="text-xl font-extrabold text-cyan-400">{correctCount}/{activeQuestions.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isAmharic ? 'እንደገና ጀምር' : 'Retry Quiz'}</span>
              </button>

              <button
                onClick={handleGenerateMoreQuestions}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAmharic ? 'አዳዲስ ጥያቄዎችን ፍጠር' : 'Generate New Questions'}</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};
