import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { postJson } from '../lib/api';
import {
  BlurtingRecallResult,
  Flashcard,
  LanguageMode,
  TopicUnit
} from '../types';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Brain,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Plus,
  Flame,
  Award,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudySuiteProps {
  unit: TopicUnit;
  language: LanguageMode;
}

export const StudySuite: React.FC<StudySuiteProps> = ({ unit, language }) => {
  const [activeTechnique, setActiveTechnique] = useState<'pomodoro' | 'blurting' | 'srs'>('pomodoro');
  const isAmharic = language === 'am';

  // Pomodoro State
  const [pomoMode, setPomoMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [distractions, setDistractions] = useState<string[]>([]);
  const [newDistraction, setNewDistraction] = useState('');
  const [ambientSound, setAmbientSound] = useState<'none' | 'binaural' | 'rain' | 'krar'>('none');

  // Web Audio Context for synthesizer ambient noise
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorNodeRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Blurting State
  const [blurtText, setBlurtText] = useState('');
  const [blurtTimer, setBlurtTimer] = useState(180); // 3 mins
  const [isBlurtRunning, setIsBlurtRunning] = useState(false);
  const [blurtResult, setBlurtResult] = useState<BlurtingRecallResult | null>(null);
  const [blurtError, setBlurtError] = useState<string | null>(null);
  const [isEvaluatingBlurt, setIsEvaluatingBlurt] = useState(false);

  // SRS Flashcards State
  const [flashcards, setFlashcards] = useState<Flashcard[]>(unit.flashcards || []);
  const [fcIndex, setFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (pomoMode === 'work') {
        setCyclesCompleted((c) => c + 1);
        setPomoMode('shortBreak');
        setTimeLeft(5 * 60);
        confetti({ particleCount: 50, spread: 60 });
      } else {
        setPomoMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, pomoMode]);

  // Blurting timer effect
  useEffect(() => {
    let interval: any = null;
    if (isBlurtRunning && blurtTimer > 0) {
      interval = setInterval(() => setBlurtTimer((t) => t - 1), 1000);
    } else if (blurtTimer === 0 && isBlurtRunning) {
      setIsBlurtRunning(false);
      handleEvaluateBlurting();
    }
    return () => clearInterval(interval);
  }, [isBlurtRunning, blurtTimer]);

  // Ambient Audio synth
  const handleToggleSound = (type: 'none' | 'binaural' | 'rain' | 'krar') => {
    if (ambientSound === type || type === 'none') {
      stopAmbientSound();
      setAmbientSound('none');
      return;
    }

    stopAmbientSound();
    setAmbientSound(type);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      if (type === 'binaural') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(210, ctx.currentTime); // Theta wave
        osc.connect(gain);
        osc.start();
        oscillatorNodeRef.current = osc;
      } else if (type === 'krar') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(144, ctx.currentTime); // Warm acoustic drone
        osc.connect(gain);
        osc.start();
        oscillatorNodeRef.current = osc;
      }
    } catch (e) {
      console.error('Audio init error:', e);
    }
  };

  const stopAmbientSound = () => {
    try {
      if (oscillatorNodeRef.current) {
        oscillatorNodeRef.current.stop();
        oscillatorNodeRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    } catch (e) {}
  };

  // Blurting evaluation
  const handleEvaluateBlurting = async () => {
    if (!blurtText.trim()) return;
    setIsEvaluatingBlurt(true);
    const keyPoints = unit.nodes.map((n) => (isAmharic ? n.labelAmharic : n.label));

    try {
      const res = await postJson('/api/blurting/evaluate', {
        topicTitle: unit.title,
        targetKeyPoints: keyPoints,
        userRecallText: blurtText
      });
      const data = res.data as any;
      if (data.success) {
        setBlurtError(null);
        setBlurtResult({
          accuracyScore: data.accuracyScore,
          recalledKeyPoints: data.recalledKeyPoints || [],
          missedKeyPoints: data.missedKeyPoints || [],
          feedback: data.feedback,
          feedbackAmharic: data.feedbackAmharic
        });
      } else {
        const isOffline = data?.error === 'offline';
        setBlurtResult(null);
        setBlurtError(
          isOffline
            ? (isAmharic
                ? 'ከበይነመረብ ጋር ስላልተገናኘህ የብሉርቲንግ ውጤት ማግኘት አልቻልን። እንደገና ተገናኝና ገጹን ጫን።'
                : "You're offline, so the blurting evaluation isn't available. Reconnect and reload.")
            : (isAmharic
                ? 'የብሉርቲንግ ውጤት ማግኘት አልተሳካም። እንደገና ሞክር።'
                : "Couldn't evaluate your blurting. Please try again.")
        );
      }
    } catch (e) {
      console.error(e);
      setBlurtError(isAmharic ? 'የብሉርቲንግ ውጤት ማግኘት አልተሳካም።' : "Couldn't evaluate your blurting. Please try again.");
    } finally {
      setIsEvaluatingBlurt(false);
    }
  };

  // SRS Flashcard handlers
  const handleRateFlashcard = (boxStep: number) => {
    if (!flashcards[fcIndex]) return;
    const updated = [...flashcards];
    updated[fcIndex].boxLevel = Math.max(1, Math.min(5, updated[fcIndex].boxLevel + boxStep));
    setFlashcards(updated);
    setIsFlipped(false);

    if (fcIndex < flashcards.length - 1) {
      setFcIndex((prev) => prev + 1);
    } else {
      confetti({ particleCount: 50 });
      setFcIndex(0);
    }
  };

  const formatMinutes = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto" id="study-suite-view">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Navigation Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-white text-sm">
              {isAmharic ? 'የሳይንሳዊ ጥናት ዘዴዎች ማዕከል' : 'Cognitive Study Suite'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTechnique('pomodoro')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTechnique === 'pomodoro'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ፖሞዶሮ (Pomodoro)' : 'Pomodoro Focus'}</span>
            </button>

            <button
              onClick={() => setActiveTechnique('blurting')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTechnique === 'blurting'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ብለርቲንግ (Blurting)' : 'Blurting Recall'}</span>
            </button>

            <button
              onClick={() => setActiveTechnique('srs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTechnique === 'srs'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ፍላሽካርድ (SRS)' : 'Spaced Repetition'}</span>
            </button>
          </div>
        </div>

        {/* TECHNIQUE 1: Pomodoro Focus Timer */}
        {activeTechnique === 'pomodoro' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timer Core */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPomoMode('work');
                    setTimeLeft(25 * 60);
                    setIsRunning(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    pomoMode === 'work'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isAmharic ? 'የጥናት ጊዜ (25m)' : 'Deep Work (25m)'}
                </button>
                <button
                  onClick={() => {
                    setPomoMode('shortBreak');
                    setTimeLeft(5 * 60);
                    setIsRunning(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    pomoMode === 'shortBreak'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isAmharic ? 'አጭር እረፍት (5m)' : 'Short Break (5m)'}
                </button>
              </div>

              {/* Big Clock Display */}
              <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800/90 w-full max-w-sm flex flex-col items-center">
                <span className="font-mono text-6xl font-extrabold tracking-tight text-white">
                  {formatMinutes(timeLeft)}
                </span>
                <span className="text-xs font-mono text-slate-500 uppercase mt-2">
                  Target: {unit.title}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-8 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl transition-all ${
                    isRunning
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                  }`}
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{isRunning ? (isAmharic ? 'አፍታ ቆም አድርግ' : 'Pause') : (isAmharic ? 'ጀምር' : 'Start Focus')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsRunning(false);
                    setTimeLeft(pomoMode === 'work' ? 25 * 60 : 5 * 60);
                  }}
                  className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Ambient Audio Selector */}
              <div className="pt-4 border-t border-slate-800 w-full flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  {isAmharic ? 'የማተኮሪያ ድምጽ፡' : 'Ambient Focus Noise:'}
                </span>
                <div className="flex items-center gap-1.5">
                  {(['none', 'binaural', 'krar'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleToggleSound(mode)}
                      className={`px-2.5 py-1 rounded-md capitalize font-mono text-[11px] transition-colors ${
                        ambientSound === mode
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode === 'krar' ? 'Traditional Krar Drone' : mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Distraction Parking Lot */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  {isAmharic ? 'የሀሳብ ማዘናጊያ መጣያ' : 'Distraction Parking Lot'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAmharic ? 'በጥናት መሃል የሚመጡብህን ሀሳቦች እዚህ ጻፋቸውና ወደ ጥናትህ ተመለስ' : 'Jot intrusive thoughts here so they don\'t break your flow.'}
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDistraction}
                  onChange={(e) => setNewDistraction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newDistraction.trim()) {
                      setDistractions([...distractions, newDistraction.trim()]);
                      setNewDistraction('');
                    }
                  }}
                  placeholder={isAmharic ? 'ሀሳብህን ጣልበት...' : 'Quick thought...'}
                  className="flex-1 bg-slate-950 text-xs text-slate-100 p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    if (newDistraction.trim()) {
                      setDistractions([...distractions, newDistraction.trim()]);
                      setNewDistraction('');
                    }
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[120px]">
                {distractions.map((d, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950 text-xs text-slate-300 border border-slate-800 flex items-center justify-between"
                  >
                    <span>{d}</span>
                    <button
                      onClick={() => setDistractions(distractions.filter((_, idx) => idx !== i))}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {distractions.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center pt-8">
                    {isAmharic ? 'ምንም ማዘናጊያ አልተመዘገበም' : 'No distractions logged yet.'}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Completed Cycles:</span>
                <span className="font-bold text-emerald-400 font-mono">{cyclesCompleted}</span>
              </div>
            </div>
          </div>
        )}

        {/* TECHNIQUE 2: Blurting Method Active Recall */}
        {activeTechnique === 'blurting' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  {isAmharic ? 'የብለርቲንግ ፈጣን ማስታወስ ልምምድ' : 'The Blurting Method (Active Retrieval)'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAmharic
                    ? '3 ደቂቃ ተሰጥቶሃል፤ ስለ ርዕሱ የምታስታውሰውን ሁሉ ያለማቋረጥ ጻፍ። ከዚያ AI ምን እንዳስታወስክ እና ምን እንደረሳህ ይገመግማል!'
                    : 'Take 3 minutes to dump every concept, formula, and step you remember from memory. AI will grade what you recalled vs missed!'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-amber-400 text-sm">
                  {formatMinutes(blurtTimer)}
                </div>

                <button
                  onClick={() => setIsBlurtRunning(!isBlurtRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isBlurtRunning
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isBlurtRunning ? 'Pause Timer' : 'Start 3m Sprint'}
                </button>
              </div>
            </div>

            <textarea
              value={blurtText}
              onChange={(e) => setBlurtText(e.target.value)}
              rows={6}
              placeholder={
                isAmharic
                  ? 'ስለዚህ ርዕስ የምታስታውሳቸውን ዋና ዋና ነጥቦች፣ ቀመሮች፣ ምሳሌዎች እዚህ ጻፍ...'
                  : 'Start typing everything you recall from this chapter without looking at notes...'
              }
              className="w-full bg-slate-950 text-sm text-slate-100 placeholder-slate-500 p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                onClick={handleEvaluateBlurting}
                disabled={!blurtText.trim() || isEvaluatingBlurt}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isEvaluatingBlurt ? 'AI is Evaluating...' : 'Evaluate My Blurting'}</span>
              </button>
            </div>

            {/* Blurting Results Analysis */}
            {blurtError && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-sm text-rose-200">
                {blurtError}
              </div>
            )}
            {blurtResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    {isAmharic ? 'የማስታወስ ምዘና ውጤት' : 'Active Recall Diagnostic'}
                  </h4>
                  <span className="text-sm font-bold font-mono px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Retrieval Score: {blurtResult.accuracyScore}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAmharic ? 'በትክክል ያስታወስካቸው ነጥቦች' : 'Successfully Retrieved Concepts:'}
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-emerald-200">
                      {blurtResult.recalledKeyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-2">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {isAmharic ? 'የተዘነጉ ቁልፍ ነጥቦች' : 'Forgotten / Missed Concepts:'}
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-rose-200">
                      {blurtResult.missedKeyPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-900">
                  <strong>AI Feedback:</strong> {isAmharic ? blurtResult.feedbackAmharic : blurtResult.feedback}
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* TECHNIQUE 3: Spaced Repetition (SRS Flashcards) */}
        {activeTechnique === 'srs' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-400" />
                  {isAmharic ? 'የተዘረጋ የክለሳ ስርዓት (Leitner SRS)' : 'Leitner Spaced Repetition Deck'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Card {fcIndex + 1} of {flashcards.length}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <span
                    key={lvl}
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[10px] font-bold ${
                      flashcards[fcIndex]?.boxLevel === lvl
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    B{lvl}
                  </span>
                ))}
              </div>
            </div>

            {/* Flashcard Flip Card */}
            {flashcards[fcIndex] && (
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[220px] p-8 rounded-2xl bg-slate-950 border-2 border-slate-800 hover:border-cyan-500/50 cursor-pointer flex flex-col justify-between transition-all duration-300 select-none text-center shadow-inner"
              >
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-mono">
                    {isFlipped ? (isAmharic ? 'መልስ (Back)' : 'Answer') : (isAmharic ? 'ጥያቄ (Front)' : 'Prompt')}
                  </span>
                  <span className="text-[11px] text-cyan-400">Click to flip ↷</span>
                </div>

                <div className="my-auto py-4">
                  <p className="text-lg font-bold text-slate-100 leading-snug">
                    {isFlipped
                      ? isAmharic ? flashcards[fcIndex].backAmharic : flashcards[fcIndex].back
                      : isAmharic ? flashcards[fcIndex].frontAmharic : flashcards[fcIndex].front}
                  </p>
                  {isAmharic && (
                    <p className="text-xs text-slate-400 font-mono mt-2">
                      {isFlipped ? flashcards[fcIndex].back : flashcards[fcIndex].front}
                    </p>
                  )}
                </div>

                <div className="text-[11px] text-slate-500">
                  Box {flashcards[fcIndex].boxLevel} • Next Review: {flashcards[fcIndex].nextReviewDate || 'Today'}
                </div>
              </div>
            )}

            {/* Rating Buttons */}
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-3"
              >
                <button
                  onClick={() => handleRateFlashcard(-1)}
                  className="p-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-700 text-xs font-bold transition-colors"
                >
                  {isAmharic ? 'ረሳሁት (Again)' : 'Again (Box 1)'}
                </button>
                <button
                  onClick={() => handleRateFlashcard(0)}
                  className="p-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-700 text-xs font-bold transition-colors"
                >
                  {isAmharic ? 'ከበደኝ (Hard)' : 'Hard'}
                </button>
                <button
                  onClick={() => handleRateFlashcard(1)}
                  className="p-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-700 text-xs font-bold transition-colors"
                >
                  {isAmharic ? 'አስታወስኩ (Good)' : 'Good (+1 Box)'}
                </button>
                <button
                  onClick={() => handleRateFlashcard(2)}
                  className="p-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-700 text-xs font-bold transition-colors"
                >
                  {isAmharic ? 'ቀላል ነው (Easy)' : 'Easy (+2 Box)'}
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
