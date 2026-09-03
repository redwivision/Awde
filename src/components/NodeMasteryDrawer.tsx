import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { postJson } from '../lib/api';
import {
  ConceptNode,
  LanguageMode,
  NodeChatMessage,
  TopicUnit
} from '../types';
import {
  X,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Flame,
  Volume2,
  VolumeX,
  CheckCircle2,
  Compass,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Coffee,
  Lightbulb,
  HelpCircle,
  Send,
  Loader2,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NodeMasteryDrawerProps {
  node: ConceptNode | null;
  unit: TopicUnit;
  language: LanguageMode;
  onClose: () => void;
  onStartFeynman: (node: ConceptNode) => void;
  onStartQuizForNode: (node: ConceptNode) => void;
  onMarkMastered: (nodeId: string) => void;
}

export const NodeMasteryDrawer: React.FC<NodeMasteryDrawerProps> = ({
  node,
  unit,
  language,
  onClose,
  onStartFeynman,
  onStartQuizForNode,
  onMarkMastered
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'analogy' | 'misconceptions' | 'formulas' | 'ask_rooty'>('analogy');
  const [chatMessages, setChatMessages] = useState<NodeChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!node) return null;

  const isAmharic = language === 'am';

  const handleAudioRead = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      const textToRead = isAmharic
        ? `${node.labelAmharic}. ${node.localizedAnalogy.titleAmharic}. ${node.localizedAnalogy.explanationAmharic}`
        : `${node.label}. ${node.localizedAnalogy.title}. ${node.localizedAnalogy.explanation}`;
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleQuickMasteryStamp = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
    onMarkMastered(node.id);
  };

  const handleAskRooty = async () => {
    const question = chatInput.trim();
    if (!question || chatLoading) return;

    const userMsg: NodeChatMessage = { role: 'user', content: question };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const result = await postJson<{ answer: string; answerAmharic: string; error?: string }>('/api/node/ask', {
        nodeLabel: node.label,
        nodeSummary: node.summary,
        question,
        language,
        chatHistory: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      });

      // postJson returns { ok:false, data:{ error:'offline' } } when the device
      // is disconnected — block with a clear message rather than a canned reply.
      if (!result.ok || !result.data?.answer) {
        const isOffline = result.data?.error === 'offline';
        setChatMessages((prev) => [
          ...prev,
          isOffline
            ? { role: 'rooty', content: "You're offline, so I can't answer right now. Reconnect and reload to keep going!", contentAmharic: 'ከበይነመረብ ጋር ስላልተገናኘህ አሁን መልስ መስጠት አልችልም። እንደገና ተገናኝና ገጹን ጫን!' }
            : { role: 'rooty', content: 'Oops — my connection hiccuped. Try again in a moment!', contentAmharic: 'ጌጋ ተፈጥሯል። እንደገና ሞክር!' }
        ]);
        return;
      }

      const rootyMsg: NodeChatMessage = {
        role: 'rooty',
        content: result.data.answer,
        contentAmharic: result.data.answerAmharic
      };
      setChatMessages((prev) => [...prev, rootyMsg]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'rooty', content: 'Oops — my connection hiccuped. Try again in a moment!', contentAmharic: 'ጌጋ ተፈጥሯል። እንደገና ሞክር!' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (node.masteryStatus) {
      case 'mastered':
        return {
          text: isAmharic ? 'የተካነ (Mastered)' : 'Mastered',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: ShieldCheck
        };
      case 'feynman_tested':
        return {
          text: isAmharic ? 'በፌይንማን የተረጋገጠ' : 'Feynman Verified',
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          icon: CheckCircle2
        };
      case 'learning':
        return {
          text: isAmharic ? 'በመማር ላይ' : 'Learning',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: Flame
        };
      default:
        return {
          text: isAmharic ? 'አልተጀመረም' : 'Unstudied',
          color: 'bg-slate-800 text-slate-400 border-slate-700',
          icon: BookOpen
        };
    }
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Drawer / Bottom Sheet Container */}
        <motion.div
          initial={{ y: window.innerWidth < 768 ? '100%' : 0, x: window.innerWidth < 768 ? 0 : '100%' }}
          animate={{ y: 0, x: 0 }}
          exit={{ y: window.innerWidth < 768 ? '100%' : 0, x: window.innerWidth < 768 ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full md:max-w-2xl h-[88vh] md:h-full mt-auto md:mt-0 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-2xl md:rounded-none shadow-2xl flex flex-col z-10 overflow-hidden text-slate-100"
          id="node-mastery-drawer"
        >
          {/* Mobile Drag Pill Handle */}
          <div className="md:hidden pt-2.5 pb-1 flex justify-center shrink-0 bg-slate-900">
            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
          </div>

          {/* Header Banner */}
          <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-slate-900/90 sticky top-0 z-20">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                    Depth Level {node.depthLevel} • {node.category}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.text}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  {isAmharic ? node.labelAmharic : node.label}
                </h2>
                {isAmharic && (
                  <p className="text-xs text-slate-400 font-mono">
                    {node.label}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('analogy')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'analogy'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የአገር ውስጥ ማነጻጸሪያ' : 'Localized Analogy'}</span>
              </button>

              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'breakdown'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የፅንሰ-ሀሳብ ትንተና' : 'Concept Core'}</span>
              </button>

              <button
                onClick={() => setActiveTab('misconceptions')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'misconceptions'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የተለመዱ ስህተቶች' : 'Common Traps'}</span>
              </button>

              <button
                onClick={() => setActiveTab('formulas')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'formulas'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ቀመሮች እና ሕጎች' : 'Rules & Formulas'}</span>
              </button>

              <button
                onClick={() => setActiveTab('ask_rooty')}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'ask_rooty'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'ንግግር ከ ሩቲ' : 'Ask Rooty'}</span>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB: Localized Analogy */}
            {activeTab === 'analogy' && (
              <div className="space-y-5">
                <div className="p-5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 relative">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                          {node.localizedAnalogy.culturalElement}
                        </span>
                        <h3 className="text-base font-bold text-amber-100">
                          {isAmharic ? node.localizedAnalogy.titleAmharic : node.localizedAnalogy.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={handleAudioRead}
                      className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs flex items-center gap-1.5 transition-colors"
                      title="Read Analogy"
                    >
                      {isPlayingAudio ? <VolumeX className="w-4 h-4 text-amber-400 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isPlayingAudio ? 'Stop' : 'Listen'}</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
                    <p className="text-amber-200/90 font-medium italic border-l-2 border-amber-500 pl-3">
                      "{isAmharic ? node.localizedAnalogy.contextAmharic : node.localizedAnalogy.context}"
                    </p>
                    <p>
                      {isAmharic ? node.localizedAnalogy.explanationAmharic : node.localizedAnalogy.explanation}
                    </p>
                    {isAmharic && (
                      <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                        <strong>English Context:</strong> {node.localizedAnalogy.explanation}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-amber-400/90">
                      <Compass className="w-3.5 h-3.5" />
                      {isAmharic ? 'የአዕምሮ ግንኙነት ምስል' : 'Cognitive Anchor'}
                    </span>
                    <span>Textbook Unit: {unit.chapter}</span>
                  </div>
                </div>

                {/* Feynman Prompt Callout */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      {isAmharic ? 'ለ Rooty ይህንን ነጥብ አስተምራት' : 'Teach Rooty this Node'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isAmharic
                        ? 'ያለ ውስብስብ ቃላት በቀላል ምሳሌ አስረድተህ የፌይንማን ማረጋገጫ ውሰድ'
                        : 'Explain it in plain language without jargon to earn the Feynman seal'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onStartFeynman(node);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all min-w-0"
                  >
                    <span>{isAmharic ? 'ወደ ሩቲ ሂድ' : 'Enter Arena'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Concept Breakdown */}
            {activeTab === 'breakdown' && (
              <div className="space-y-5">
                {/* Core Definition */}
                <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    {isAmharic ? 'መሠረታዊ ማብራሪያ' : 'Standard Core Definition'}
                  </h3>
                  <p className="text-sm text-slate-200 leading-relaxed font-normal">
                    {isAmharic ? node.summaryAmharic : node.summary}
                  </p>
                  {isAmharic && (
                    <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400 border border-slate-800">
                      <strong className="text-slate-300">English Text:</strong> {node.summary}
                    </div>
                  )}
                </div>

                {/* Detailed Explanation */}
                {node.detailedExplanation && (
                  <div className="p-5 rounded-xl bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/20 space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {isAmharic ? 'ዝርዝር ማብራሪያ' : 'Detailed Explanation'}
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {isAmharic && node.detailedExplanationAmharic ? node.detailedExplanationAmharic : node.detailedExplanation}
                    </p>
                    {isAmharic && node.detailedExplanation && (
                      <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400 border border-slate-800">
                        <strong className="text-slate-300">English:</strong> {node.detailedExplanation}
                      </div>
                    )}
                  </div>
                )}

                {/* Key Takeaways */}
                {node.keyTakeaways && node.keyTakeaways.length > 0 && (
                  <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5" />
                      {isAmharic ? 'ቁልፍ ነጥቦች' : 'Key Takeaways'}
                    </h3>
                    <ul className="space-y-2">
                      {(isAmharic && node.keyTakeawaysAmharic ? node.keyTakeawaysAmharic : node.keyTakeaways).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    {isAmharic && node.keyTakeaways && (
                      <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400 border border-slate-800 space-y-1">
                        <strong className="text-slate-300">English Takeaways:</strong>
                        <ul className="space-y-0.5">
                          {node.keyTakeaways.map((pt, i) => (
                            <li key={i}>• {pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Prerequisites chain */}
                {node.prerequisites && node.prerequisites.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                    <span className="text-xs font-mono text-slate-400 uppercase">
                      {isAmharic ? 'ቅድመ-ሁኔታዎች' : 'Prerequisites for this Node'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {node.prerequisites.map((pId) => {
                        const target = unit.nodes.find((n) => n.id === pId);
                        return (
                          <span
                            key={pId}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700 font-medium"
                          >
                            {target ? (isAmharic ? target.labelAmharic : target.label) : pId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Related Concepts */}
                {(() => {
                  const connectedIds = new Set<string>();
                  unit.connections.forEach((c) => {
                    if (c.from === node.id) connectedIds.add(c.to);
                    if (c.to === node.id) connectedIds.add(c.from);
                  });
                  const related = unit.nodes.filter(
                    (n) => n.id !== node.id && (connectedIds.has(n.id) || n.category === node.category)
                  ).slice(0, 4);
                  if (related.length === 0) return null;
                  return (
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2.5">
                      <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3" />
                        {isAmharic ? 'ተዛማሽ ጽንሰ-ሀሳቦች' : 'Related Concepts'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {related.map((rn) => (
                          <span
                            key={rn.id}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-xs border border-slate-700/80 font-medium hover:bg-slate-700/80 hover:text-white transition-colors cursor-default"
                          >
                            {isAmharic ? rn.labelAmharic : rn.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: Common Misconceptions */}
            {activeTab === 'misconceptions' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                  <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {isAmharic ? 'ተማሪዎች የሚሳሳቱባቸው ነጥቦች' : 'High-Frequency Exam & Intuition Traps'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAmharic
                      ? 'ፈተና ላይ የተለመዱ አሳሳች አማራጮች እና የተሳሳቱ አመለካከቶች'
                      : 'Common conceptual misunderstandings and trick questions'}
                  </p>
                </div>

                <div className="space-y-3">
                  {(node.commonMisconceptions || []).map((misc, idx) => {
                    const miscAm = node.misconceptionsAmharic?.[idx];
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-lg bg-slate-950/80 border border-rose-900/40 text-sm space-y-1.5"
                      >
                        <div className="flex items-start gap-2.5 text-rose-200">
                          <span className="font-mono text-xs text-rose-400 shrink-0">#{idx + 1}</span>
                          <p>{isAmharic && miscAm ? miscAm : misc}</p>
                        </div>
                        {isAmharic && (
                          <p className="text-xs text-slate-500 pl-6">
                            <strong>EN:</strong> {misc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: Formulas & Laws */}
            {activeTab === 'formulas' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    {isAmharic ? 'ሕጎች፣ ቀመሮች እና መርሆች' : 'Governing Laws & Mathematical Relations'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAmharic ? 'በዚህ ጽንሰ-ሀሳብ ውስጥ ያሉ ዋና ዋና ቀመሮች' : 'Key formulas and quantitative statements'}
                  </p>
                </div>

                {node.keyFormulasOrRules && node.keyFormulasOrRules.length > 0 ? (
                  <div className="space-y-2">
                    {node.keyFormulasOrRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                        <code>{rule}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {isAmharic ? 'ምንም ቀመር የለም (ፅንሰ-ሀሳባዊ ርዕስ ነው)' : 'Conceptual qualitative node without standalone formulas.'}
                  </p>
                )}
              </div>
            )}

            {/* TAB: Ask Rooty */}
            {activeTab === 'ask_rooty' && (
              <div className="flex flex-col h-full">
                {/* Intro prompt */}
                {chatMessages.length === 0 && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2 mb-4">
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      {isAmharic ? 'ስለ ጽንሰ-ሀሳቡ ጥያቄ ያቅርቡ' : 'Ask Rooty anything about this concept'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAmharic
                        ? '栎-ti ያለ ውስብስብ ቃላት በቀላል ምሳሌ ይመልስልሃል'
                        : 'Rooty will answer in plain language with Ethiopian cultural analogies when helpful'}
                    </p>
                  </div>
                )}

                {/* Chat messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pb-4 min-h-0">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-md'
                        }`}
                      >
                        {isAmharic && msg.role === 'rooty' && msg.contentAmharic ? msg.contentAmharic : msg.content}
                        {isAmharic && msg.role === 'rooty' && msg.contentAmharic && (
                          <p className="text-xs text-slate-500 mt-1.5 pt-1.5 border-t border-slate-700">
                            EN: {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-slate-800 border border-slate-700 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span className="text-xs text-slate-400">{isAmharic ? '栎-ti ይazeneka...' : 'Rooty is thinking...'}</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat input */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskRooty(); } }}
                      placeholder={isAmharic ? 'ጥያቄ ያቅርቡ...' : 'Ask a question...'}
                      className="flex-1 bg-slate-950/80 text-sm text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                      disabled={chatLoading}
                    />
                    <button
                      onClick={handleAskRooty}
                      disabled={!chatInput.trim() || chatLoading}
                      className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-20">
            <button
              onClick={handleQuickMasteryStamp}
              className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAmharic ? 'የተካነ ብለህ መዝግብ' : 'Mark Mastered'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onStartQuizForNode(node);
                }}
                className="px-4 py-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>{isAmharic ? 'ፈተና ጀምር' : 'Quiz Node'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onStartFeynman(node);
                }}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Zap className="w-4 h-4" />
                <span>{isAmharic ? 'ለሩቲ አስተምር' : 'Teach Rooty'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
