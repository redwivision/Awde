import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TopicUnit,
  ConceptNode,
  LanguageMode,
  DesignAesthetic,
  ActiveTab
} from '../types';
import { AwdeLogo } from './AwdeLogo';
import {
  Network,
  MessageSquare,
  HelpCircle,
  Clock,
  BookMarked,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  CheckCircle2,
  Flame,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  BookOpen,
  Sparkles,
  Palette,
  Globe,
  FlaskConical,
  X
} from 'lucide-react';

interface WorkspaceSidebarProps {
  units: TopicUnit[];
  currentUnitId: string;
  onSelectUnit: (unitId: string) => void;
  selectedNodeId?: string;
  onSelectNode: (node: ConceptNode) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language: LanguageMode;
  onToggleLanguage: () => void;
  onOpenAesthetics: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  workspacesCount?: number;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  units,
  currentUnitId,
  onSelectUnit,
  selectedNodeId,
  onSelectNode,
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  onOpenAesthetics,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  workspacesCount
}) => {
  const [expandedUnitId, setExpandedUnitId] = useState<string>(currentUnitId);
  const [filterQuery, setFilterQuery] = useState('');
  const isAmharic = language === 'am';

  const currentUnit = units.find((u) => u.id === currentUnitId) || units[0];

  const totalMastered = currentUnit?.nodes.filter((n) => n.masteryScore >= 75).length || 0;
  const masteryPercent = Math.round((totalMastered / (currentUnit?.nodes.length || 1)) * 100);

  const filteredUnits = units.filter((u) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      u.title.toLowerCase().includes(q) ||
      u.titleAmharic.includes(q) ||
      u.subject.toLowerCase().includes(q) ||
      u.nodes.some((n) => n.label.toLowerCase().includes(q) || n.labelAmharic.includes(q))
    );
  });

  const getNodeStatusColor = (node: ConceptNode) => {
    if (node.masteryScore >= 75) return 'bg-emerald-500 text-emerald-400';
    if (node.masteryScore >= 40) return 'bg-amber-500 text-amber-400';
    return 'bg-slate-400 text-slate-400';
  };

  const navItems = [
    {
      id: 'mindmap' as const,
      label: 'Mind-Map Studio',
      labelAmharic: 'የእይታ ካርታ',
      icon: Network,
      badge: `${currentUnit?.nodes.length || 0} nodes`
    },
    {
      id: 'feynman' as const,
      label: 'Teach Rooty (Feynman)',
      labelAmharic: 'ሩቲን አስተምር (Feynman)',
      icon: MessageSquare,
      badge: 'AI Peer'
    },
    {
      id: 'experiment_lab' as const,
      label: 'Method Laboratory',
      labelAmharic: 'የጥናት ዘዴዎች ላብ',
      icon: FlaskConical,
      badge: 'Efficacy Δ'
    },
    {
      id: 'quiz' as const,
      label: 'Active Recall & Quizzes',
      labelAmharic: 'ፈተናዎችና ልምምድ',
      icon: HelpCircle,
      badge: `${currentUnit?.quizQuestions.length || 0} Qs`
    },
    {
      id: 'studysuite' as const,
      label: 'Deep Work Suite',
      labelAmharic: 'የጥናት ማዕከል',
      icon: Clock,
      badge: 'Pomodoro'
    },
    {
      id: 'library' as const,
      label: 'Home & Curriculum Library',
      labelAmharic: 'መነሻ እና የመጻሕፍት ማዕከል',
      icon: BookMarked,
      badge: `${workspacesCount ?? units.length} Books`
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800/90 text-slate-200 select-none overflow-hidden">
      {/* Workspace Brand Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
        <div
          onClick={() => {
            onSelectTab('library');
            if (isMobileOpen) onCloseMobile();
          }}
          className="cursor-pointer min-w-0"
        >
          <AwdeLogo size={isCollapsed ? 'sm' : 'md'} showText={!isCollapsed} isAmharic={isAmharic} />
        </div>

        {/* Mobile close button / Desktop collapse toggle */}
        <div className="flex items-center gap-1">
          {/* Mobile close */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Navigation Views */}
      <div className="p-3 border-b border-slate-800/80 shrink-0 space-y-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-2 py-1 font-semibold flex items-center justify-between">
          {!isCollapsed && <span>{isAmharic ? 'የስራ ቦታ መሳሪያዎች' : 'Workspace Views'}</span>}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (isMobileOpen) onCloseMobile();
              }}
              title={isAmharic ? item.labelAmharic : item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{isAmharic ? item.labelAmharic : item.label}</span>
                  {item.badge && !isActive && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Curriculum Units & Nodes Tree Explorer */}
      {!isCollapsed ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Header with Search & Add Unit */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {isAmharic ? 'የትምህርት ክፍሎች' : 'Curricula & Units'}
            </span>
            <button
              onClick={() => {
                onSelectTab('library');
                if (isMobileOpen) onCloseMobile();
              }}
              className="p-2 min-h-[40px] min-w-[40px] rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
              title="Add or import unit"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Filter Search in Sidebar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={isAmharic ? 'ክፍሎችን ፈልግ...' : 'Search units & nodes...'}
              className="w-full bg-slate-950/80 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-2.5 py-2.5 min-h-[40px] rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Unit List */}
          <div className="space-y-1.5">
            {filteredUnits.map((u) => {
              const isSelected = u.id === currentUnitId;
              const isExpanded = expandedUnitId === u.id;
              const uMastered = u.nodes.filter((n) => n.masteryScore >= 75).length;
              const uPct = Math.round((uMastered / u.nodes.length) * 100);

              return (
                <div
                  key={u.id}
                  className={`rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-950/80 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Unit Title Bar */}
                  <div
                    onClick={() => {
                      onSelectUnit(u.id);
                      setExpandedUnitId(isExpanded ? '' : u.id);
                    }}
                    className="p-2.5 flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedUnitId(isExpanded ? '' : u.id);
                        }}
                        className="text-slate-400 hover:text-white p-2 min-h-[40px] min-w-[40px]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-indigo-400' : 'text-slate-200 group-hover:text-white'
                            }`}
                          >
                            {isAmharic ? u.titleAmharic : u.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{u.gradeOrLevel}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">{uPct}% done</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-slate-300">
                      {u.nodes.length}
                    </div>
                  </div>

                  {/* Sub-node tree when expanded */}
                  {isExpanded && (
                    <div className="px-2 pb-2 pt-1 border-t border-slate-800/60 space-y-1">
                      {u.nodes.map((node) => {
                        const isNodeActive = selectedNodeId === node.id;
                        return (
                          <div
                            key={node.id}
                            onClick={() => {
                              onSelectUnit(u.id);
                              onSelectNode(node);
                              if (isMobileOpen) onCloseMobile();
                            }}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2.5 min-h-[40px] rounded-lg text-xs cursor-pointer transition-all ${
                              isNodeActive
                                ? 'bg-indigo-950/80 text-indigo-300 font-bold border border-indigo-800/60'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  node.masteryScore >= 75
                                    ? 'bg-emerald-400'
                                    : node.masteryScore >= 40
                                    ? 'bg-amber-400'
                                    : 'bg-slate-600'
                                }`}
                              />
                              <span className="truncate">
                                {isAmharic ? node.labelAmharic : node.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {node.masteryScore}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center py-4 space-y-3 overflow-y-auto">
          {units.map((u) => {
            const isSelected = u.id === currentUnitId;
            return (
              <button
                key={u.id}
                onClick={() => onSelectUnit(u.id)}
                title={isAmharic ? u.titleAmharic : u.title}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {u.subject.slice(0, 2).toUpperCase()}
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Footer Widget: Quick Tools & Settings */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-950/60 shrink-0 space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono text-slate-400">
                {isAmharic ? 'የክፍሉ አጠቃላይ ብቃት' : 'Current Unit Mastery'}
              </div>
              <div className="text-xs font-bold text-emerald-400">
                {masteryPercent}% {isAmharic ? 'ተጠናቋል' : 'Complete'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 justify-between">
          {/* Aesthetic Chooser */}
          <button
            onClick={onOpenAesthetics}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[40px] px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            title="Choose Aesthetic"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            {!isCollapsed && <span>{isAmharic ? 'ገጽታ' : 'Theme'}</span>}
          </button>

          {/* Bilingual Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[40px] px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            {!isCollapsed && <span>{language === 'am' ? 'አማርኛ' : 'EN'}</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 shrink-0 h-full ${
          isCollapsed ? 'w-16' : 'w-72 lg:w-80'
        }`}
        id="desktop-workspace-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Backdrop & Panel */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-[85%] max-w-xs h-full z-10 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
