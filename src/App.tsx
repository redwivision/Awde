import React, { useState, useEffect, useMemo } from 'react';
import {
  ConceptNode,
  LanguageMode,
  TopicUnit,
  DesignAesthetic,
  ActiveTab,
  TextbookWorkspace
} from './types';
import { DEFAULT_TEXTBOOK_WORKSPACES } from './data/textbookWorkspaces';
import { AESTHETIC_THEMES } from './data/themes';
import { loadWorkspaces as loadWorkspacesFromStorage } from './data/persistence';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { HomePage } from './components/HomePage';
import { WorkspaceDetail } from './components/WorkspaceDetail';
import { UploadPdfModal } from './components/UploadPdfModal';
import { MindMapCanvas } from './components/MindMapCanvas';
import { NodeMasteryDrawer } from './components/NodeMasteryDrawer';
import { FeynmanArena } from './components/FeynmanArena';
import { QuizEngine } from './components/QuizEngine';
import { StudySuite } from './components/StudySuite';
import { StudyMethodLab } from './components/StudyMethodLab';
import { AestheticsModal } from './components/AestheticsModal';
import { CommandPalette } from './components/CommandPalette';
import {
  Menu,
  Search,
  Palette,
  Globe,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Command
} from 'lucide-react';

export default function App() {
  // ---------- Persistence helpers ----------
  const loadWorkspaces = (): TextbookWorkspace[] => loadWorkspacesFromStorage(localStorage);

  // Primary store: textbook workspaces. Units are derived by flattening.
  const [workspaces, setWorkspaces] = useState<TextbookWorkspace[]>(loadWorkspaces);

  const [currentUnitId, setCurrentUnitId] = useState<string>(
    () => workspaces[0]?.units[0]?.id || DEFAULT_TEXTBOOK_WORKSPACES[0].units[0].id
  );

  const [language, setLanguage] = useState<LanguageMode>(() => {
    const saved = localStorage.getItem('awde_lang');
    return (saved as LanguageMode) || 'en';
  });

  // Default to Nordic Minimal aesthetic
  const [aesthetic, setAesthetic] = useState<DesignAesthetic>(() => {
    const saved = localStorage.getItem('awde_aesthetic');
    return (saved as DesignAesthetic) || 'nordic-light';
  });

  const [isAestheticsModalOpen, setIsAestheticsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Selected node for Mastery Drawer / Feynman
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Derived flat unit list (single source of truth = workspaces)
  const units = useMemo(() => workspaces.flatMap((w) => w.units), [workspaces]);

  // Active unit object
  const currentUnit = units.find((u) => u.id === currentUnitId) || units[0];

  // Active workspace object (when browsing a book detail)
  const activeWorkspace = activeWorkspaceId
    ? workspaces.find((w) => w.id === activeWorkspaceId) || null
    : null;

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('awde_workspaces_v1', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('awde_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('awde_aesthetic', aesthetic);
    document.documentElement.setAttribute('data-theme', aesthetic);
  }, [aesthetic]);

  // Global shortcut for Cmd+K / Ctrl+K Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If no node selected yet, select first node of active unit
  useEffect(() => {
    if (currentUnit && currentUnit.nodes.length > 0) {
      if (!selectedNode || !currentUnit.nodes.some((n) => n.id === selectedNode.id)) {
        setSelectedNode(currentUnit.nodes[0]);
      }
    }
  }, [currentUnitId]);

  const isAmharic = language === 'am';
  const currentThemeObj = AESTHETIC_THEMES.find((t) => t.id === aesthetic) || AESTHETIC_THEMES[2]; // Default Nordic

  // Handle node selection from MindMap or Sidebar
  const handleSelectNode = (node: ConceptNode, unitId?: string) => {
    if (unitId && unitId !== currentUnitId) {
      setCurrentUnitId(unitId);
    }
    if (unitId) setActiveWorkspaceId(null);
    setSelectedNode(node);
    setIsDrawerOpen(true);
  };

  // Node mastery updates
  const handleUpdateNodeMastery = (nodeId: string, score: number, status: any) => {
    setWorkspaces((prev) =>
      prev.map((ws) => ({
        ...ws,
        units: ws.units.map((unit) => {
          if (unit.id !== currentUnitId) return unit;
          return {
            ...unit,
            nodes: unit.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    masteryScore: Math.max(n.masteryScore, score),
                    masteryStatus: status || n.masteryStatus
                  }
                : n
            )
          };
        })
      }))
    );
  };

  const handleMarkMastered = (nodeId: string) => {
    handleUpdateNodeMastery(nodeId, 100, 'mastered');
  };

  // Switch to Feynman Arena from Drawer
  const handleStartFeynmanFromDrawer = (node: ConceptNode) => {
    setSelectedNode(node);
    setIsDrawerOpen(false);
    setActiveWorkspaceId(null);
    setActiveTab('feynman');
  };

  // Switch to Quiz from Drawer
  const handleStartQuizFromDrawer = (node: ConceptNode) => {
    setSelectedNode(node);
    setIsDrawerOpen(false);
    setActiveWorkspaceId(null);
    setActiveTab('quiz');
  };

  // Create a brand new workspace from an uploaded / synthesized textbook
  const handleWorkspaceCreated = (newWs: TextbookWorkspace) => {
    setWorkspaces((prev) => [newWs, ...prev]);
    setActiveWorkspaceId(newWs.id);
    setCurrentUnitId(newWs.units[0]?.id || currentUnitId);
    setActiveTab('mindmap');
  };

  // Jump from the sidebar / palette directly into a unit's study tools
  const handleOpenUnit = (unitId: string, nodeId?: string) => {
    setCurrentUnitId(unitId);
    if (nodeId) {
      const target = units.find((u) => u.id === unitId)?.nodes.find((n) => n.id === nodeId);
      if (target) setSelectedNode(target);
    }
    setActiveWorkspaceId(null);
    setActiveTab('mindmap');
  };

  // Navigate into a whole-book workspace detail
  const handleOpenWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
  };

  // Calculate unit mastery progress
  const totalNodes = currentUnit?.nodes.length || 1;
  const masteredCount = currentUnit?.nodes.filter((n) => n.masteryScore >= 75).length || 0;
  const unitMasteryPercent = Math.round((masteredCount / totalNodes) * 100);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'mindmap':
        return isAmharic ? 'የእይታ ካርታ' : 'Mind-Map Studio';
      case 'feynman':
        return isAmharic ? 'ሩቲን አስተምር' : 'Feynman Arena (Teach Rooty)';
      case 'experiment_lab':
        return isAmharic ? 'የጥናት ዘዴዎች ላብራቶሪ' : 'Cognitive Method Laboratory';
      case 'quiz':
        return isAmharic ? 'ፈተናዎችና ልምምድ' : 'Active Recall Quizzes';
      case 'studysuite':
        return isAmharic ? 'የጥናት ማዕከል' : 'Deep Work Suite';
      case 'library':
        return isAmharic ? 'የመጻሕፍት ማዕከል' : 'Curriculum Library';
      default:
        return 'Workspace';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Workspace Persistent / Collapsible Sidebar */}
      <WorkspaceSidebar
        units={units}
        currentUnitId={currentUnitId}
        onSelectUnit={handleOpenUnit}
        selectedNodeId={selectedNode?.id}
        onSelectNode={handleSelectNode}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActiveWorkspaceId(null);
        }}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'am' ? 'en' : 'am')}
        onOpenAesthetics={() => setIsAestheticsModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        workspacesCount={workspaces.length}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950">
        {/* Workspace Top Bar (Breadcrumbs, Search & Quick Actions) */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 px-3 sm:px-5 flex items-center justify-between shrink-0 z-20 gap-3 backdrop-blur-md">
          {/* Left: Mobile Sidebar Trigger & Breadcrumbs */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Open workspace navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

{/* Breadcrumb Hierarchy Navigation */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                <span className="hidden sm:inline font-semibold text-slate-300">
                  Awde
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline shrink-0" />
                {activeWorkspace ? (
                  <>
                    <span className="font-semibold text-indigo-400 truncate max-w-[160px] sm:max-w-[260px]">
                      {isAmharic ? activeWorkspace.titleAmharic : activeWorkspace.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="text-slate-200 font-bold truncate">
                      {isAmharic ? 'የመጽሐፍ አጠቃላይ እይታ' : 'Book Overview'}
                    </span>
                  </>
                ) : activeTab === 'library' ? (
                  <span className="text-slate-200 font-bold truncate">
                    {isAmharic ? 'የመጻሕፍት ማዕከል' : 'Curriculum Library'}
                  </span>
                ) : (
                  <>
                    <span className="font-semibold text-indigo-400 truncate max-w-[140px] sm:max-w-[220px]">
                      {isAmharic ? currentUnit.titleAmharic : currentUnit.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="text-slate-200 font-bold truncate">
                      {getTabTitle()}
                    </span>
                  </>
                )}
              </div>
          </div>

          {/* Right: Quick Search & Theme Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Command Palette Jump Search */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition-colors"
              title="Search workspace (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-[11px]">
                {isAmharic ? 'ፈልግ...' : 'Search...'}
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                ⌘K
              </kbd>
            </button>

            {/* Theme Picker Pill */}
            <button
              onClick={() => setIsAestheticsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              title="Select Design Aesthetic"
              id="header-aesthetic-btn"
            >
              <div
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: currentThemeObj.palette.accent }}
              />
              <span className="hidden sm:inline text-xs">
                {isAmharic ? currentThemeObj.nameAmharic.split(' ')[0] : currentThemeObj.name.split(' ')[0]}
              </span>
            </button>

            {/* Bilingual Quick Toggle */}
            <button
              onClick={() => setLanguage(language === 'am' ? 'en' : 'am')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              title="Toggle Amharic / English"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs">{language === 'am' ? 'AM' : 'EN'}</span>
            </button>
          </div>
        </header>

        {/* Main Canvas Workspace Content */}
          <main className="flex-1 relative overflow-hidden bg-slate-950">
            {activeWorkspace ? (
              /* Whole-book detail view (Book -> Units -> Topics) */
              <WorkspaceDetail
                workspace={activeWorkspace}
                language={language}
                onOpenUnit={handleOpenUnit}
                onSelectNode={handleSelectNode}
                onBackToLibrary={() => {
                  setActiveWorkspaceId(null);
                  setActiveTab('library');
                }}
              />
            ) : (
              <>
                {activeTab === 'library' && (
                  <HomePage
                    workspaces={workspaces}
                    currentUnit={currentUnit}
                    onSelectUnit={(unitId) => {
                      setCurrentUnitId(unitId);
                      setActiveWorkspaceId(null);
                      setActiveTab('mindmap');
                    }}
                    onSelectWorkspace={handleOpenWorkspace}
                    onNavigateTab={(tab) => {
                      setActiveTab(tab);
                      setActiveWorkspaceId(null);
                    }}
                    onOpenPdfModal={() => setIsPdfModalOpen(true)}
                    onSelectNodeForFeynman={(node, unit) => {
                      setCurrentUnitId(unit.id);
                      setActiveWorkspaceId(null);
                      setSelectedNode(node);
                      setActiveTab('feynman');
                    }}
                    language={language}
                  />
                )}

                {activeTab === 'mindmap' && (
                  <MindMapCanvas
                    unit={currentUnit}
                    language={language}
                    onSelectNode={handleSelectNode}
                    selectedNodeId={selectedNode?.id}
                  />
                )}

                {activeTab === 'feynman' && selectedNode && (
                  <FeynmanArena
                    unit={currentUnit}
                    selectedNode={selectedNode}
                    language={language}
                    onSelectNode={(node) => setSelectedNode(node)}
                    onUpdateNodeMastery={handleUpdateNodeMastery}
                  />
                )}

                {activeTab === 'experiment_lab' && (
                  <StudyMethodLab
                    unit={currentUnit}
                    units={units}
                    language={language}
                    onNavigateToMethod={(tab, nodeId) => {
                      if (nodeId) {
                        const targetNode = currentUnit.nodes.find((n) => n.id === nodeId);
                        if (targetNode) setSelectedNode(targetNode);
                      }
                      setActiveTab(tab);
                    }}
                  />
                )}

                {activeTab === 'quiz' && (
                  <QuizEngine
                    unit={currentUnit}
                    language={language}
                    onAddCustomQuestions={(newQs) => {
                      setWorkspaces((prev) =>
                        prev.map((ws) => ({
                          ...ws,
                          units: ws.units.map((u) =>
                            u.id === currentUnitId
                              ? { ...u, quizQuestions: [...u.quizQuestions, ...newQs] }
                              : u
                          )
                        }))
                      );
                    }}
                  />
                )}

                {activeTab === 'studysuite' && (
                  <StudySuite unit={currentUnit} language={language} />
                )}
              </>
            )}
          </main>
      </div>

      {/* Slide-in / Bottom Sheet Node Mastery Drawer */}
      {isDrawerOpen && selectedNode && (
        <NodeMasteryDrawer
          node={selectedNode}
          unit={currentUnit}
          language={language}
          onClose={() => setIsDrawerOpen(false)}
          onStartFeynman={handleStartFeynmanFromDrawer}
          onStartQuizForNode={handleStartQuizFromDrawer}
          onMarkMastered={handleMarkMastered}
        />
      )}

      {/* Quick Jump Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        units={units}
        onSelectUnit={handleOpenUnit}
        onSelectNode={handleSelectNode}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setActiveWorkspaceId(null);
        }}
        language={language}
      />

      {/* Textbook PDF Import Modal */}
      <UploadPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onWorkspaceCreated={handleWorkspaceCreated}
        language={language}
      />

      {/* Design Aesthetics Modal */}
      <AestheticsModal
        isOpen={isAestheticsModalOpen}
        onClose={() => setIsAestheticsModalOpen(false)}
        currentAesthetic={aesthetic}
        onSelectAesthetic={(newAesthetic) => {
          setAesthetic(newAesthetic);
        }}
        language={language}
      />
    </div>
  );
}
