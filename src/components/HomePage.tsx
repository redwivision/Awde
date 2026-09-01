import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Network,
  MessageSquare,
  FlaskConical,
  HelpCircle,
  Clock,
  ArrowRight,
  Plus,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle2,
  FileText,
  Search,
  BookMarked
} from 'lucide-react';
import {
  LanguageMode,
  ActiveTab,
  TextbookWorkspace,
  TopicUnit,
  ConceptNode
} from '../types';
import { AwdeLogo } from './AwdeLogo';

interface HomePageProps {
  workspaces: TextbookWorkspace[];
  currentUnit: TopicUnit;
  onSelectUnit: (unitId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenPdfModal: () => void;
  onSelectNodeForFeynman: (node: ConceptNode, unit: TopicUnit) => void;
  language: LanguageMode;
}

export const HomePage: React.FC<HomePageProps> = ({
  workspaces,
  currentUnit,
  onSelectUnit,
  onSelectWorkspace,
  onNavigateTab,
  onOpenPdfModal,
  onSelectNodeForFeynman,
  language
}) => {
  const isAmharic = language === 'am';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isAmharic && w.titleAmharic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalTopics = workspaces.reduce((acc, w) => acc + w.totalTopics, 0);
  const totalUnits = workspaces.reduce((acc, w) => acc + w.totalUnits, 0);

  return (
    <div
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)'
      }}
      className="flex-1 overflow-y-auto min-h-screen"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Top Hero Section */}
        <div
          style={{
            backgroundColor: 'var(--app-surface, #ffffff)',
            borderColor: 'var(--app-border, #cbd5e1)'
          }}
          className="relative rounded-3xl p-6 sm:p-10 border shadow-sm overflow-hidden"
        >
          {/* Subtle geometric background accent */}
          <div
            style={{
              backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.06))'
            }}
            className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
                  borderColor: 'var(--app-border-strong, #94a3b8)',
                  color: 'var(--app-accent, #4f46e5)'
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAmharic ? 'የኢትዮጵያ ሳይንስ እና ሂሳብ የጥናት ማዕከል' : 'Cognitive STEM Mastery Platform'}
              </span>
              <span
                style={{ color: 'var(--app-text-muted, #475569)' }}
                className="text-xs font-medium"
              >
                {isAmharic ? 'የስርዓተ-ትምህርት ማይንድ-ማፕ እና ፈይንድማን አሬና' : 'Hierarchical Knowledge Graphs & Socratic Feynman'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {isAmharic
                ? 'በእይታ ማይንድ-ማፕ እና በሶቅራጥስ ውይይት የትምህርት ይዘቶችን ጠንቅቀው ይረዱ'
                : 'Turn Any Textbook Into an Interactive Mind-Map & Socratic Arena'}
            </h1>

            <p
              style={{ color: 'var(--app-text-muted, #475569)' }}
              className="text-sm sm:text-base leading-relaxed"
            >
              {isAmharic
                ? 'ከመማሪያ መጽሐፍ PDF ተነስተው ሙሉውን የመጽሐፍ ተዋረድ (መጽሐፍ → ምዕራፍ → ርዕስ → ንዑስ ጽንሰ-ሀሳብ) በግልጽ ካርታ ይመልከቱ። ሩቲን (Rooty) በማስተማር የዕውቀት ክፍተቶችን ይዝጉ።'
                : 'Structure complex STEM textbooks into deep multi-level spatial graphs. Teach concepts in plain everyday language to Rooty to detect hidden misconceptions and prove recall retention.'}
            </p>

            {/* Hero Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateTab('mindmap')}
                style={{
                  backgroundColor: 'var(--app-accent, #4f46e5)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 hover:opacity-90 transition-all hover:scale-[1.02]"
              >
                <Network className="w-4 h-4" />
                {isAmharic ? 'የእይታ ካርታውን ክፈት' : 'Explore Mind-Map Studio'}
              </button>

              <button
                onClick={() => onNavigateTab('feynman')}
                style={{
                  backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text, #020617)'
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm border shadow-sm flex items-center gap-2 hover:border-indigo-500 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                {isAmharic ? 'ሩቲን አስተምር (Feynman)' : 'Teach Rooty (Feynman Arena)'}
              </button>

              <button
                onClick={onOpenPdfModal}
                style={{
                  backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text, #020617)'
                }}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border shadow-sm flex items-center gap-2 hover:border-indigo-500 transition-all"
              >
                <Plus className="w-4 h-4 text-indigo-500" />
                {isAmharic ? 'አዲስ መጽሐፍ (PDF) ጨምር' : 'Import Textbook PDF'}
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                borderColor: 'var(--app-border, #cbd5e1)'
              }}
              className="pt-6 mt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <div>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs">
                  {isAmharic ? 'የመማሪያ መጻሕፍት' : 'Textbook Workspaces'}
                </p>
                <p className="text-xl font-extrabold mt-0.5">{workspaces.length} {isAmharic ? 'መጻሕፍት' : 'Books'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs">
                  {isAmharic ? 'ምዕራፎችና ክፍሎች' : 'Differentiated Units'}
                </p>
                <p className="text-xl font-extrabold mt-0.5">{totalUnits} {isAmharic ? 'ክፍሎች' : 'Units'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs">
                  {isAmharic ? 'የትምህርት ርዕሶች' : 'Structured Topics'}
                </p>
                <p className="text-xl font-extrabold mt-0.5">{totalTopics} {isAmharic ? 'ርዕሶች' : 'Topics'}</p>
              </div>
              <div>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs">
                  {isAmharic ? 'የጥናት ውጤታማነት' : 'Average Efficacy Jump'}
                </p>
                <p className="text-xl font-extrabold mt-0.5 text-emerald-600 dark:text-emerald-400">+58% Recall Δ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Workspaces Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-500" />
                {isAmharic ? 'የመማሪያ መጻሕፍት ማዕከላት (Textbook Workspaces)' : 'Textbook Workspaces & Mind-Maps'}
              </h2>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs mt-0.5">
                {isAmharic
                  ? 'እያንዳንዱ መጽሐፍ የራሱ የሆነ የመጽሐፍ፣ የምዕራፎች እና የርዕሶች የእይታ ካርታ አለው'
                  : 'Multi-level hierarchical graph workspaces for Ethiopian MoE & STEM Curricula'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="relative flex items-center border rounded-xl px-3 py-1.5 w-full sm:w-64"
              >
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAmharic ? 'መጽሐፍ ወይም ትምህርት ይፈልጉ...' : 'Filter workspaces...'}
                  style={{ color: 'var(--app-text, #020617)' }}
                  className="bg-transparent text-xs w-full focus:outline-none"
                />
              </div>

              <button
                onClick={onOpenPdfModal}
                style={{
                  backgroundColor: 'var(--app-accent, #4f46e5)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm hover:opacity-90"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAmharic ? 'መጽሐፍ ጨምር' : 'New PDF'}
              </button>
            </div>
          </div>

          {/* Workspaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {ws.subject}
                        </span>
                        <span style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] font-medium">
                          {ws.gradeOrLevel}
                        </span>
                      </div>
                      <h3 className="font-bold text-base mt-1.5 group-hover:text-indigo-500 transition-colors">
                        {isAmharic ? ws.titleAmharic : ws.title}
                      </h3>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
                        color: 'var(--app-accent, #4f46e5)'
                      }}
                      className="p-2.5 rounded-xl shrink-0"
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Units Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {ws.units.map((u) => (
                      <button
                        key={u.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUnit(u.id);
                          onNavigateTab('mindmap');
                        }}
                        style={{
                          backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                          borderColor: 'var(--app-border, #cbd5e1)',
                          color: 'var(--app-text, #020617)'
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg border font-medium hover:border-indigo-500 transition-colors flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {isAmharic ? u.titleAmharic : u.title}
                      </button>
                    ))}
                  </div>

                  {/* Progress info */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span style={{ color: 'var(--app-text-muted, #475569)' }}>
                        {isAmharic ? 'የእውቀት ብቃት' : 'Mastery Progress'}
                      </span>
                      <span className="font-mono text-indigo-500">{ws.overallMastery}%</span>
                    </div>
                    <div
                      style={{ backgroundColor: 'var(--app-surface-elevated, #f8fafc)' }}
                      className="w-full h-1.5 rounded-full overflow-hidden"
                    >
                      <div
                        style={{
                          width: `${ws.overallMastery}%`,
                          backgroundColor: 'var(--app-accent, #4f46e5)'
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div
                  style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
                  className="pt-4 mt-4 border-t flex items-center justify-between gap-2"
                >
                  <div style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px]">
                    {ws.totalUnits} {isAmharic ? 'ክፍሎች' : 'Units'} • {ws.totalTopics} {isAmharic ? 'ርዕሶች' : 'Topics'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ws.units[0]) onSelectUnit(ws.units[0].id);
                        onNavigateTab('mindmap');
                      }}
                      style={{
                        backgroundColor: 'var(--app-accent, #4f46e5)',
                        color: 'var(--app-accent-text, #ffffff)'
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:opacity-90 shadow-sm"
                    >
                      <Network className="w-3.5 h-3.5" />
                      {isAmharic ? 'ማይንድ-ማፕ' : 'Mind-Map'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ws.units[0] && ws.units[0].nodes[0]) {
                          onSelectUnit(ws.units[0].id);
                          onSelectNodeForFeynman(ws.units[0].nodes[0], ws.units[0]);
                          onNavigateTab('feynman');
                        }
                      }}
                      style={{
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                        borderColor: 'var(--app-border, #cbd5e1)',
                        color: 'var(--app-text, #020617)'
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border hover:border-emerald-500 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      {isAmharic ? 'ፈይንድማን' : 'Feynman'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Custom PDF Card */}
            <div
              onClick={onOpenPdfModal}
              style={{
                backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                borderColor: 'var(--app-border-strong, #94a3b8)'
              }}
              className="rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:border-indigo-500 transition-all group"
            >
              <div
                style={{
                  backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
                  color: 'var(--app-accent, #4f46e5)'
                }}
                className="p-3.5 rounded-2xl group-hover:scale-110 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {isAmharic ? 'አዲስ የመማሪያ መጽሐፍ (PDF) ያስገቡ' : 'Upload Any STEM Textbook (PDF)'}
                </h4>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs mt-1 max-w-xs">
                  {isAmharic
                    ? 'ስርዓቱ በራሱ ምዕራፎችን በመለየት የመጽሐፉን፣ የምዕራፎቹን እና የርዕሶቹን ተዋረድ ይገነባል'
                    : 'Awde auto-differentiates units, topics, sub-concepts, and Socratic dialogues instantly.'}
                </p>
              </div>
              <span
                style={{ color: 'var(--app-accent, #4f46e5)' }}
                className="text-xs font-bold flex items-center gap-1"
              >
                {isAmharic ? 'ፋይል ይምረጡ' : 'Upload & Build Workspace'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* The 3 Cognitive Pillars Section */}
        <div className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {isAmharic ? 'የአውደ (Awde) ሶስቱ የዕውቀት ምሰሶዎች' : 'The 3 Cognitive Pillars of Deep STEM Retention'}
            </h2>
            <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs text-slate-500">
              {isAmharic ? 'ማስታወስ ብቻ ሳይሆን መረዳት እና በተግባር ማረጋገጥ' : 'Designed for high-order synthesis rather than rote memorization'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)'
              }}
              className="p-5 rounded-2xl border space-y-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">
                {isAmharic ? '1. ባለብዙ-ደረጃ የእይታ ካርታ' : '1. Multi-Level Structural Maps'}
              </h3>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs leading-relaxed">
                {isAmharic
                  ? 'ከመጽሐፉ መነሻ እስከ ጥቃቅን ቀመሮች ድረስ ያለውን ግንኙነት እና የምዕራፎች ትስስር በግልጽ የሚያሳይ ካርታ።'
                  : 'See the macro hierarchy from Book Root → Unit Hubs → Topic Nodes, including cross-unit energy and mechanism links.'}
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)'
              }}
              className="p-5 rounded-2xl border space-y-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">
                {isAmharic ? '2. የፈይንድማን ውይይት (Rooty)' : '2. Socratic Feynman Peer (Rooty)'}
              </h3>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs leading-relaxed">
                {isAmharic
                  ? 'ሳይንሳዊ ቃላትን (Jargon) አስወግደው በጀበና፣ በመሶብ እና በህዳሴ ግድብ ምሳሌዎች ለሩቲን ያስረዱ። ሩቲን የመረዳት መጠኑን በቅጽበት ይለካል!'
                  : 'Explain concepts in plain words to Rooty. Rooty flags raw textbook jargon and grades conceptual clarity on a 0-100% meter.'}
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)'
              }}
              className="p-5 rounded-2xl border space-y-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">
                {isAmharic ? '3. የውጤታማነት ላብራቶሪ (Efficacy Δ)' : '3. Cognitive Method Laboratory'}
              </h3>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs leading-relaxed">
                {isAmharic
                  ? 'ከጥናት በፊት እና በኋላ ያለውን የማስታወስ ልዩነት (Recall Δ) በመለካት የትኛው ዘዴ ለአንጎልዎ እንደሚስማማ በሳይንሳዊ መንገድ ይወቁ።'
                  : 'Track objective Before-vs-After recall jumps (+40% to +85%) to identify your most effective learning methodology.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
