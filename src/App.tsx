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
import { getSession, confirmLogin, extractMagicToken, pushWorkspace, pullWorkspaces, isServerSynced } from './lib/sync';
import { useOnlineStatus } from './lib/api';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { LandingPage } from './components/LandingPage';
import { HomePage } from './components/HomePage';
import { WorkspaceDetail } from './components/WorkspaceDetail';
import { MindMapCanvas } from './components/MindMapCanvas';
import { OnboardingTour } from './components/OnboardingTour';
import { ConsentGate, getConsent, saveConsent, ConsentRecord } from './components/ConsentGate';

// Heavy / on-demand components are lazy-loaded so the initial bundle stays
// small on weak wifi. Each loads only when it is actually opened.
const UploadPdfModal = React.lazy(() =>
  import('./components/UploadPdfModal').then((m) => ({ default: m.UploadPdfModal }))
);
const NodeMasteryDrawer = React.lazy(() =>
  import('./components/NodeMasteryDrawer').then((m) => ({ default: m.NodeMasteryDrawer }))
);
const FeynmanArena = React.lazy(() =>
  import('./components/FeynmanArena').then((m) => ({ default: m.FeynmanArena }))
);
const QuizEngine = React.lazy(() =>
  import('./components/QuizEngine').then((m) => ({ default: m.QuizEngine }))
);
const StudySuite = React.lazy(() =>
  import('./components/StudySuite').then((m) => ({ default: m.StudySuite }))
);
const StudyMethodLab = React.lazy(() =>
  import('./components/StudyMethodLab').then((m) => ({ default: m.StudyMethodLab }))
);
const AestheticsModal = React.lazy(() =>
  import('./components/AestheticsModal').then((m) => ({ default: m.AestheticsModal }))
);
const AccountModal = React.lazy(() =>
  import('./components/AccountModal').then((m) => ({ default: m.AccountModal }))
);
const CommandPalette = React.lazy(() =>
  import('./components/CommandPalette').then((m) => ({ default: m.CommandPalette }))
);
import {
  Menu,
  Search,
  Palette,
  Globe,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Command,
  WifiOff,
  HelpCircle,
  UserRound
} from 'lucide-react';

const TabSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[40vh]">
    <div
      className="w-8 h-8 rounded-full border-2 animate-spin"
      style={{ borderColor: 'var(--app-accent-bg, rgba(79,70,229,0.25))', borderTopColor: 'var(--app-accent, #4f46e5)' }}
    />
  </div>
);

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

  // Landing page is the entry point on every fresh app load.
  const [isLandingOpen, setIsLandingOpen] = useState(true);

  // Informed-consent gate — shown once before the workspace is usable.
  const [needsConsent, setNeedsConsent] = useState<boolean>(() => !getConsent());

  // First-run onboarding tour — shown the first time the user enters the
  // workspace, then remembered so it never nags again (can be re-opened via
  // the header Help button at any time).
  const [tourActive, setTourActive] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('awde_tour_v2') === 'done';
  });
  // Once the user dismisses the tour (Skip / Esc / backdrop), stop auto-reopening
  // it on this load. A manual reopen via the header Help button still works.
  const [dismissedTour, setDismissedTour] = useState(false);

  // Open the tour the first time, but only AFTER the workspace content has
  // had a moment to render — otherwise it would point at a blank screen.
  useEffect(() => {
    if (isLandingOpen || hasSeenTour || tourActive || dismissedTour) return;
    const t = window.setTimeout(() => setTourActive(true), 900);
    return () => window.clearTimeout(t);
  }, [isLandingOpen, hasSeenTour, tourActive, dismissedTour]);

  // Fallback-mode banner — shown when the server has no Gemini key, so AI
  // features use deterministic offline generators. Distinct from device
  // offline (no network at all), which is handled by the online-status hook.
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);

  // Live device connectivity. When offline, AI requests short-circuit in
  // lib/api.ts and show a notice instead of hanging.
  const isDeviceOnline = useOnlineStatus();

  useEffect(() => {
    // Check if the server is running without a Gemini key (fallback mode)
    const checkFallbackMode = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setShowFallbackBanner(!data.hasGeminiKey);
      } catch {
        setShowFallbackBanner(true);
      }
    };
    checkFallbackMode();
  }, []);

  const [isAestheticsModalOpen, setIsAestheticsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
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

  const currentWorkspace = workspaces.find((w) => w.units.some((u) => u.id === currentUnitId));
  const sidebarUnits = activeWorkspace
    ? activeWorkspace.units
    : activeTab === 'library'
      ? units
      : currentWorkspace?.units || units;

  // Save to localStorage (always), and push to the server when logged in
  // (debounced, fire-and-forget — offline/local mode silently no-ops).
  useEffect(() => {
    localStorage.setItem('awde_workspaces_v1', JSON.stringify(workspaces));
    if (!getSession()) return;
    const t = window.setTimeout(() => {
      for (const ws of workspaces) {
        void pushWorkspace(ws);
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('awde_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('awde_aesthetic', aesthetic);
    document.documentElement.setAttribute('data-theme', aesthetic);
  }, [aesthetic]);

  // Server-side sync on mount: if this is a magic-link return visit, consume the
  // token and store the session; then pull the user's server workspaces and
  // merge them in (server wins when its updatedAt is newer). Offline/local-mode
  // safe — any failure just leaves the local copy untouched.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const magicToken = getSession() ? null : extractMagicToken(window.location.href);
        if (magicToken) {
          const res = await confirmLogin(magicToken);
          if (!res.ok || cancelled) return;
          // Don't leave a one-time token sitting in the address bar.
          window.history.replaceState({}, '', window.location.pathname);
        }
        const serverRows = await pullWorkspaces();
        if (!serverRows || cancelled) return;
        setWorkspaces((prev) => {
          const map = new Map<string, TextbookWorkspace>();
          for (const w of prev) map.set(w.id, w);
          for (const row of serverRows) {
            const id = row.data.id || row.workspaceId;
            // Take the server copy when we've never seen it, or when we don't
            // already know the server is at-or-newer than this row.
            if (!map.has(id)) {
              map.set(id, row.data);
            } else if (!isServerSynced(id, row.updatedAt)) {
              map.set(id, row.data);
            }
          }
          return Array.from(map.values());
        });
      } catch {
        /* offline/local-mode — keep local copy */
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

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
    // Auto-select first unit when opening a workspace
    const ws = workspaces.find((w) => w.id === workspaceId);
    if (ws && ws.units[0]) {
      setCurrentUnitId(ws.units[0].id);
    }
  };

  // Calculate unit mastery progress
  const totalNodes = currentUnit?.nodes.length || 1;
  const masteredCount = currentUnit?.nodes.filter((n) => n.masteryScore >= 75).length || 0;
  const unitMasteryPercent = Math.round((masteredCount / totalNodes) * 100);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'mindmap':
        return isAmharic ? 'ካርታ' : 'Map';
      case 'feynman':
        return isAmharic ? 'ሩቲን አስተምር' : 'Teach Rooty';
      case 'experiment_lab':
        return isAmharic ? 'ለካ' : 'Measure';
      case 'quiz':
        return isAmharic ? 'ፈተና' : 'Quiz';
      case 'studysuite':
        return isAmharic ? 'ትኩረት' : 'Focus';
      case 'library':
        return isAmharic ? 'መጻሕፍት' : 'Books';
      default:
        return 'Awde';
    }
  };

  return (
    <>
      {/* Age-gate + informed consent, shown once before the workspace */}
      {needsConsent && (
        <ConsentGate
          language={language}
          onAgree={(record: ConsentRecord) => {
            saveConsent(record);
            setNeedsConsent(false);
          }}
        />
      )}

      {isLandingOpen ? (
    <LandingPage
      language={language}
      onToggleLanguage={() => setLanguage(language === 'am' ? 'en' : 'am')}
      onEnterWorkspace={() => setIsLandingOpen(false)}
      workspacesCount={workspaces.length}
      currentAesthetic={aesthetic}
      onSelectAesthetic={setAesthetic}
    />
  ) : (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      {/* Device Offline Banner — network completely unavailable */}
      {!isDeviceOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/95 backdrop-blur-sm text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium shadow-lg">
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            {isAmharic
              ? 'ከበይነ መረብ ጋር አልተገናኘም። የAI ባህሪያት በአሁኑ ጊዜ አይገኙም። በይነመረቡ ሲመለስ ገጹን እንደገና ይጫኑ።'
              : 'You are offline. AI features are unavailable — reconnect and reload to continue.'}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors font-semibold"
          >
            {isAmharic ? 'እንደገና ጫን' : 'Reload'}
          </button>
        </div>
      )}

      {/* Fallback Mode Banner — server running without a Gemini key */}
      {showFallbackBanner && isDeviceOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 backdrop-blur-sm text-amber-950 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {isAmharic
              ? 'ኦፍላይን ሁነታ፡ ስርዓቱ በራስ-ሰር የተፈጠሩ መረጃዎችን እየተጠቀመ ነው። የGemini API ቁልፍ በማስገባት ሙሉ AI ባህሪያትን ማግኘት ይችላሉ።'
              : 'Offline Mode: Using deterministic fallback generators. Configure GEMINI_API_KEY to unlock live AI features.'}
          </span>
          <button
            onClick={() => setShowFallbackBanner(false)}
            className="ml-2 px-2 py-0.5 rounded bg-amber-900/20 hover:bg-amber-900/30 transition-colors"
          >
            {isAmharic ? 'ዝጋ' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Workspace Persistent / Collapsible Sidebar */}
      <WorkspaceSidebar
        units={sidebarUnits}
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
                      {isAmharic ? 'መጽሐፍ' : 'Book'}
                    </span>
                  </>
                ) : activeTab === 'library' ? (
                  <span className="text-slate-200 font-bold truncate">
                    {isAmharic ? 'መጻሕፍት' : 'Books'}
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
            {/* Onboarding Help */}
            <button
              onClick={() => setTourActive(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              title={isAmharic ? 'የመመሪያ ጉብኝት' : 'Show the quick tour'}
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-xs">
                {isAmharic ? 'መመሪያ' : 'Tour'}
              </span>
            </button>

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

            {/* Account / Sign-in Pill */}
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              title={isAmharic ? 'መለያ' : 'Account'}
              id="header-account-btn"
            >
              <UserRound className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-xs">{isAmharic ? 'መለያ' : 'Account'}</span>
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
              <React.Suspense fallback={<TabSpinner />}>
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
              </React.Suspense>
            )}
          </main>
      </div>

      {/* Slide-in / Bottom Sheet Node Mastery Drawer */}
      <React.Suspense fallback={null}>
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

      {/* Account / Sign-in Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        language={language}
      />
      </React.Suspense>

      {/* First-run Onboarding Tour */}
      <OnboardingTour
        isOpen={tourActive}
        language={language}
        onClose={() => {
          setTourActive(false);
          setDismissedTour(true);
        }}
        onComplete={() => {
          setHasSeenTour(true);
          setDismissedTour(true);
          localStorage.setItem('awde_tour_v2', 'done');
        }}
      />
    </div>
    )}
    </>
  );
}
