import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { postJson } from '../lib/api';
import {
  ConceptNode,
  FeynmanDialogueTurn,
  FeynmanEvaluation,
  LanguageMode,
  RootyEmotion,
  TopicUnit,
  MethodExperimentLog
} from '../types';
import { RootyAvatar } from './RootyAvatar';
import {
  Send,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Award,
  HelpCircle,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
  TrendingUp,
  Brain,
  Gauge,
  ArrowRight,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeynmanArenaProps {
  unit: TopicUnit;
  selectedNode: ConceptNode;
  language: LanguageMode;
  onSelectNode: (node: ConceptNode) => void;
  onUpdateNodeMastery: (nodeId: string, score: number, status: any) => void;
}

export const FeynmanArena: React.FC<FeynmanArenaProps> = ({
  unit,
  selectedNode,
  language,
  onSelectNode,
  onUpdateNodeMastery
}) => {
  const [userText, setUserText] = useState('');
  const [strictness, setStrictness] = useState<'gentle' | 'balanced' | 'ironclad'>('balanced');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<RootyEmotion>('neutral');
  const [dialogue, setDialogue] = useState<FeynmanDialogueTurn[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<FeynmanEvaluation | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Efficacy Delta & Pre-Confidence Tracking
  const [preConfidence, setPreConfidence] = useState<number>(2);
  const [showPreAssessmentModal, setShowPreAssessmentModal] = useState<boolean>(false);
  const [showDeltaSuccessBanner, setShowDeltaSuccessBanner] = useState<boolean>(false);
  const [computedDelta, setComputedDelta] = useState<number | null>(null);

  // Socratic Step Tracking
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isAmharic = language === 'am';

  // Initialize dialogue with Rooty's opening challenge
  useEffect(() => {
    const openingEnglish = `Alright, teacher! Teach me "${selectedNode.label}". Explain it as if I'm an 8-year-old or someone who has never opened this textbook. No memorized buzzwords — use a real physical analogy!`;
    const openingAmharic = `ሰላም አስተማሪዬ! ስለ "${selectedNode.labelAmharic}" አስረዳኝ። ምንም አይነት ውስብስብ የሳይንስ ቃላት ሳትጠቀም፣ አንድ የ8 ዓመት ልጅ በሚገባው ቀላል የዕለት ተዕለት ምሳሌ አስተምረኝ!`;

    setDialogue([
      {
        id: 'turn_init',
        speaker: 'rooty',
        text: isAmharic ? openingAmharic : openingEnglish,
        emotion: 'neutral',
        timestamp: Date.now()
      }
    ]);
    setCurrentEmotion('neutral');
    setLastEvaluation(null);
    setShowDeltaSuccessBanner(false);
    setComputedDelta(null);
    setCurrentStep(1);
  }, [selectedNode.id, language]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dialogue, isLoading]);

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Please type your explanation.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = isAmharic ? 'am-ET' : 'en-US';

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
  };

  const handleSubmitExplanation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userText.trim() || isLoading) return;

    const userTurnText = userText.trim();
    setUserText('');

    const newDialogue: FeynmanDialogueTurn[] = [
      ...dialogue,
      {
        id: 'turn_user_' + Date.now(),
        speaker: 'user',
        text: userTurnText,
        timestamp: Date.now()
      }
    ];
    setDialogue(newDialogue);
    setIsLoading(true);

    try {
      const res = await postJson('/api/feynman/evaluate', {
        nodeLabel: selectedNode.label,
        nodeSummary: selectedNode.summary,
        userExplanation: userTurnText,
        language,
        strictnessLevel: strictness,
        chatHistory: newDialogue.map((d) => ({ speaker: d.speaker, text: d.text }))
      });

      const data = res.data as { success?: boolean; evaluation?: any; isFallback?: boolean };
      if (data.success && data.evaluation) {
        const evalData: FeynmanEvaluation = {
          nodeId: selectedNode.id,
          nodeLabel: selectedNode.label,
          ...data.evaluation
        };

        setLastEvaluation(evalData);
        setCurrentEmotion(evalData.emotion);

        // Advance Socratic Phase
        if (evalData.score >= 50 && currentStep === 1) setCurrentStep(2);
        if (evalData.score >= 75 && currentStep === 2) setCurrentStep(3);

        const rootyReply = isAmharic ? evalData.rootyCritiqueAmharic : evalData.rootyCritique;
        const followUp = isAmharic ? evalData.followUpQuestionAmharic : evalData.followUpQuestion;

        const fullReply = `${rootyReply} \n\n${followUp ? (isAmharic ? `የኔ ጥያቄ፡ ${followUp}` : `My follow-up test: ${followUp}`) : ''}`;

        setDialogue((prev) => [
          ...prev,
          {
            id: 'turn_rooty_' + Date.now(),
            speaker: 'rooty',
            text: fullReply,
            emotion: evalData.emotion,
            timestamp: Date.now(),
            jargonDetected: evalData.detectedJargon,
            scoreSnapshot: evalData.score
          }
        ]);

        // Update node score in parent
        if (evalData.score > selectedNode.masteryScore) {
          const newStatus = evalData.passed ? 'feynman_tested' : 'learning';
          onUpdateNodeMastery(selectedNode.id, evalData.score, newStatus);
        }

        // Calculate and record Efficacy Delta in Study Method Lab
        const preScore = preConfidence * 20; // 2 -> 40%
        const delta = Math.max(0, evalData.score - preScore);
        setComputedDelta(delta);

        if (evalData.passed || evalData.score >= 75) {
          setShowDeltaSuccessBanner(true);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 }
          });

          // Record in localStorage experiments
          try {
            const existingRaw = localStorage.getItem('awde_experiments_v1');
            const list: MethodExperimentLog[] = existingRaw ? JSON.parse(existingRaw) : [];
            const newLog: MethodExperimentLog = {
              id: 'exp_' + Date.now(),
              timestamp: Date.now(),
              dateStr: 'Just now',
              nodeId: selectedNode.id,
              nodeTitle: selectedNode.label,
              unitId: unit.id,
              unitTitle: unit.title,
              methodsUsed: ['feynman'],
              preConfidence,
              preRecallScore: preScore,
              postRecallScore: evalData.score,
              deltaPercent: delta,
              timeSpentSeconds: 300,
              jargonEliminatedCount: evalData.detectedJargon?.length || 2,
              retentionRating: delta >= 40 ? 'Super Synergy' : 'High Retention',
              notes: `Feynman dialogue evaluated at ${evalData.score}% clarity.`
            };
            localStorage.setItem('awde_experiments_v1', JSON.stringify([newLog, ...list]));
          } catch (e) {
            console.error('Error saving experiment log:', e);
          }
        }
      }
    } catch (err) {
      console.error('Feynman evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAnalogyHint = () => {
    const hint = isAmharic
      ? `ለምሳሌ እንደ ${selectedNode.localizedAnalogy.culturalElement}፡ ${selectedNode.localizedAnalogy.contextAmharic}`
      : `For example, think of ${selectedNode.localizedAnalogy.culturalElement}: ${selectedNode.localizedAnalogy.context}`;
    setUserText((prev) => (prev ? `${prev} ${hint}` : hint));
  };

  const currentScore = lastEvaluation ? lastEvaluation.score : Math.max(25, selectedNode.masteryScore);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-slate-950 text-slate-100 overflow-hidden" id="feynman-arena-view">
      {/* Left Column: Rooty Socratic Terminal & Evaluator */}
      <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4 shrink-0">
        {/* Top Node Selector */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                {isAmharic ? 'የሚማረው ጽንሰ-ሀሳብ' : 'Target Concept to Teach'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {unit.subject}
              </span>
            </div>
            <select
              value={selectedNode.id}
              onChange={(e) => {
                const n = unit.nodes.find((item) => item.id === e.target.value);
                if (n) onSelectNode(n);
              }}
              className="w-full bg-slate-950 text-xs sm:text-sm font-bold text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500 truncate"
            >
              {unit.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {isAmharic ? n.labelAmharic : n.label} ({n.masteryScore}%)
                </option>
              ))}
            </select>
          </div>

          {/* Rooty Avatar Centerpiece */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <RootyAvatar
              emotion={currentEmotion}
              size="lg"
              isSpeaking={isLoading || isSpeaking}
              strictnessMode={strictness}
            />

            {/* Rooty's Live Confusion / Understanding Gauge */}
            <div className="w-full mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  {isAmharic ? 'የሩቲ መረዳት መጠን' : "Rooty's Understanding"}
                </span>
                <span className={`font-bold ${currentScore >= 75 ? 'text-emerald-400' : currentScore >= 50 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {currentScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  style={{ width: `${currentScore}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentScore >= 75 ? 'bg-emerald-400' : currentScore >= 50 ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}
                />
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentScore >= 85
                  ? (isAmharic ? '🎉 ጽንሰ-ሀሳቡን በሚገባ ተረድቼዋለሁ!' : '🎉 Crystal clear! I completely get it!')
                  : currentScore >= 60
                  ? (isAmharic ? '💡 ምሳሌህ ረድቶኛል፣ ማጠቃለያውን አጠናክር።' : '💡 Your analogy helped. Wrap it up!')
                  : (isAmharic ? '🤔 ቃላቱ ትንሽ ከብደውኛል፣ አቃለው...' : '🤔 Still a bit complex. Simplify more!')}
              </div>
            </div>

            {/* Strictness Level Selector */}
            <div className="mt-3 w-full pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                {isAmharic ? 'ጥብቅነት' : 'Strictness'}
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {(['gentle', 'balanced', 'ironclad'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStrictness(mode)}
                    className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition-all ${
                      strictness === mode
                        ? mode === 'ironclad'
                          ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                          : mode === 'gentle'
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3-Step Socratic Feynman Pipeline Roadmap */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
            <Target className="w-3 h-3 text-indigo-400" />
            {isAmharic ? 'የፌይንማን 3ቱ ደረጃዎች' : '3-Step Feynman Pipeline'}
          </span>
          <div className="space-y-1.5 text-xs">
            <div className={`p-2 rounded-lg border flex items-center justify-between ${currentStep >= 1 ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <span className="font-semibold">1. {isAmharic ? 'ቀላል ትርጉም' : 'Simple Definition'}</span>
              {currentScore >= 40 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className={`p-2 rounded-lg border flex items-center justify-between ${currentStep >= 2 ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <span className="font-semibold">2. {isAmharic ? 'ተጨባጭ ምሳሌ' : 'Physical Analogy'}</span>
              {currentScore >= 70 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className={`p-2 rounded-lg border flex items-center justify-between ${currentStep >= 3 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
              <span className="font-semibold">3. {isAmharic ? 'የድንበር ጥያቄ' : 'Boundary Defense'}</span>
              {currentScore >= 85 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Socratic Dialogue Stream & Response Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
        {/* Efficacy Delta Banner when passed */}
        <AnimatePresence>
          {showDeltaSuccessBanner && computedDelta !== null && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-emerald-700/60 flex items-center justify-between gap-3 text-xs shrink-0"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-300">
                  {isAmharic ? 'የእውቀት እድገት ተመዝግቧል!' : 'Efficacy Delta Validated!'}
                </span>
                <span className="text-slate-300">
                  {isAmharic
                    ? `ከጥናት በፊት ከነበረበት +${computedDelta}% እድገት አሳይቷል።`
                    : `Recall jumped +${computedDelta}% after Socratic teaching.`}
                </span>
              </div>
              <button
                onClick={() => setShowDeltaSuccessBanner(false)}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-200 underline shrink-0"
              >
                {isAmharic ? 'እሺ' : 'Dismiss'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" id="feynman-dialogue-stream">
          {dialogue.map((turn) => {
            const isUser = turn.speaker === 'user';
            return (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <RootyAvatar emotion={turn.emotion || 'neutral'} size="sm" />
                  </div>
                )}

                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{turn.text}</p>

                  {/* Flagged Jargon Badges */}
                  {turn.jargonDetected && turn.jargonDetected.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        ⚠️ {isAmharic ? 'የተጠረጠሩ ከባድ ቃላት፡' : 'Jargon flagged:'}
                      </span>
                      {turn.jargonDetected.map((j, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800"
                        >
                          {j}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isUser && (
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <button
                        onClick={() => handleSpeakText(turn.text)}
                        className="hover:text-white flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3 text-indigo-400" />
                        {isAmharic ? 'አድምጥ' : 'Listen'}
                      </button>
                      <span className="font-mono">
                        {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-900/60 rounded-xl max-w-xs border border-slate-800">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>{isAmharic ? 'ሩቲ ማብራሪያህን እየገመገመ ነው...' : 'Rooty is evaluating your explanation...'}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Bottom Input Console & Cultural Analogy Helper */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 shrink-0 space-y-2">
          {/* Quick Cultural Hint Prompt Pill */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <button
              onClick={handleUseAnalogyHint}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 text-[11px] font-medium border border-amber-800/60 transition-colors shrink-0"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>
                {isAmharic ? 'የኢትዮጵያ ምሳሌ ተጠቀም፡' : 'Use cultural analogy:'}{' '}
                <strong>{selectedNode.localizedAnalogy.culturalElement}</strong>
              </span>
            </button>

            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Shift + Enter for newline
            </span>
          </div>

          <form onSubmit={handleSubmitExplanation} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitExplanation();
                  }
                }}
                placeholder={
                  isAmharic
                    ? 'ጽንሰ-ሀሳቡን ለሩቲ በቀላል ምሳሌ ያስረዱ...'
                    : 'Explain this concept to Rooty using simple everyday words and analogies...'
                }
                rows={2}
                className="w-full bg-slate-950 text-xs sm:text-sm text-slate-100 placeholder-slate-500 p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleToggleVoiceInput}
              className={`p-3 rounded-xl border transition-colors ${
                isRecording
                  ? 'bg-red-600 border-red-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Voice Input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={!userText.trim() || isLoading}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors shadow-sm"
              title="Send Explanation"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
