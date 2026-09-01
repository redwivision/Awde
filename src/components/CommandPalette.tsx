import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TopicUnit,
  ConceptNode,
  LanguageMode,
  ActiveTab
} from '../types';
import {
  Search,
  Network,
  MessageSquare,
  HelpCircle,
  Clock,
  BookMarked,
  Sparkles,
  ArrowRight,
  FlaskConical,
  X
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  units: TopicUnit[];
  onSelectUnit: (unitId: string) => void;
  onSelectNode: (node: ConceptNode, unitId: string) => void;
  onSelectTab: (tab: ActiveTab) => void;
  language: LanguageMode;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  units,
  onSelectUnit,
  onSelectNode,
  onSelectTab,
  language
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isAmharic = language === 'am';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keydown listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Flatten nodes with unit reference
  const allNodes = units.flatMap((u) =>
    u.nodes.map((n) => ({
      ...n,
      unitId: u.id,
      unitTitle: isAmharic ? u.titleAmharic : u.title
    }))
  );

  const filteredNodes = allNodes.filter((n) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      n.label.toLowerCase().includes(q) ||
      n.labelAmharic.includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const tools = [
    { id: 'mindmap' as const, name: isAmharic ? 'የእይታ ካርታ (Mind-Map)' : 'Mind-Map Graph Canvas', icon: Network },
    { id: 'feynman' as const, name: isAmharic ? 'ሩቲን አስተምር (Feynman Arena)' : 'Teach Rooty (Feynman Arena)', icon: MessageSquare },
    { id: 'experiment_lab' as const, name: isAmharic ? 'የጥናት ዘዴዎች ላብራቶሪ (Method Lab)' : 'Cognitive Method Laboratory (Efficacy Δ)', icon: FlaskConical },
    { id: 'quiz' as const, name: isAmharic ? 'ፈተናዎች (Active Recall Quizzes)' : 'Active Recall Quizzes', icon: HelpCircle },
    { id: 'studysuite' as const, name: isAmharic ? 'የጥናት ማዕከል (Study Suite)' : 'Study Suite & Pomodoro', icon: Clock },
    { id: 'library' as const, name: isAmharic ? 'የመጻሕፍት ማዕከል (Textbook Library)' : 'Curriculum & Textbook Library', icon: BookMarked }
  ].filter((t) => !query || t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm select-none">
        {/* Backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
          id="workspace-command-palette"
        >
          {/* Search Input Bar */}
          <div className="p-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/60">
            <Search className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAmharic ? 'ጽንሰ-ሀሳብ፣ መሳሪያ ወይም ርዕስ ፈልግ...' : 'Search concepts, tools, formulas...'}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results Area */}
          <div className="p-3 overflow-y-auto space-y-4 flex-1">
            {/* Quick Tools */}
            {tools.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-0.5 font-bold">
                  {isAmharic ? 'መሳሪያዎች' : 'Workspace Views'}
                </div>
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectTab(tool.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors text-xs text-slate-200 group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-indigo-950/50 text-indigo-400 border border-indigo-800/40">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-slate-200 group-hover:text-white">
                          {tool.name}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Concepts */}
            {filteredNodes.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-0.5 font-bold">
                  {isAmharic ? 'ጽንሰ-ሀሳቦች' : 'Concept Nodes'}
                </div>
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => {
                      onSelectUnit(node.unitId);
                      onSelectNode(node, node.unitId);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/80 text-left transition-colors text-xs text-slate-200 group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 group-hover:text-indigo-300 truncate">
                          {isAmharic ? node.labelAmharic : node.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                          {node.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {node.unitTitle} • 💡 {node.localizedAnalogy.culturalElement}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {node.masteryScore}%
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tools.length === 0 && filteredNodes.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                {isAmharic ? 'ምንም ውጤት አልተገኘም' : 'No matching concepts or tools found.'}
              </div>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>ESC to close</span>
            <span>Awde Quick Jump</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
