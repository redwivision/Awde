import React, { useState } from 'react';
import {
  Network,
  MessageSquare,
  FlaskConical,
  ArrowRight,
  Plus,
  Layers,
  Search,
  BookMarked,
  Sparkles
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

const display = "font-display antialiased";

export const HomePage: React.FC<HomePageProps> = ({
  workspaces,
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

  return (
    <div
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)'
      }}
      className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-10 py-10 space-y-12">
        {/* Top welcome */}
        <section className="max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] flex items-center gap-2" style={{ color: 'var(--app-accent, #4f46e5)' }}>
            <Sparkles className="w-3.5 h-3.5" /> {isAmharic ? 'መነሻ' : 'Welcome'}
          </span>
          <h1 className={`${display} mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08]`}>
            {isAmharic
              ? 'ትምህርቶችዎን በእውነት ይረዱ።'
              : 'Understand your schoolwork, for real.'}
          </h1>
          <p
            className="mt-5 text-base sm:text-lg leading-relaxed"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            {isAmharic
              ? 'ከታች ያሉ መጻሕፍትዎን ይክፈቱ፣ ወይም አዲስ መጽሐፍ ያስገቡ።'
              : 'Open one of your books below, or bring in a new one. Awde works even when you are offline.'}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('mindmap')}
              style={{
                backgroundColor: 'var(--app-accent, #4f46e5)',
                color: 'var(--app-accent-text, #ffffff)'
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all"
            >
              <Network className="w-4 h-4" />
              {isAmharic ? 'ካርታውን ክፈት' : 'Open the map'}
            </button>
            <button
              onClick={onOpenPdfModal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border shadow-sm hover:shadow-md transition-all"
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--app-accent, #4f46e5)' }} />
              {isAmharic ? 'አዲስ መጽሐፍ ጨምር' : 'Add a book'}
            </button>
          </div>
        </section>

        {/* Books list */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className={`${display} text-2xl font-extrabold tracking-tight flex items-center gap-2`}>
                <BookMarked className="w-5 h-5" style={{ color: 'var(--app-accent, #4f46e5)' }} />
                {isAmharic ? 'መጻሕፍትዎ' : 'Your books'}
              </h2>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-sm mt-1">
                {isAmharic
                  ? `${workspaces.length} መጻሕፍት • ${totalTopics} ርዕሶች`
                  : `${workspaces.length} books • ${totalTopics} topics`}
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)'
              }}
              className="relative flex items-center border rounded-full px-4 py-2 w-full sm:w-72"
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--app-text-muted, #475569)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAmharic ? 'መጽሐፍ ይፈልጉ...' : 'Find a book...'}
                style={{ color: 'var(--app-text, #020617)' }}
                className="bg-transparent text-sm w-full ml-2 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredWorkspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="rounded-3xl border p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between cursor-pointer hover:-translate-y-0.5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                            color: 'var(--app-accent, #4f46e5)'
                          }}
                        >
                          {ws.subject}
                        </span>
                        <span style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs font-medium">
                          {ws.gradeOrLevel}
                        </span>
                      </div>
                      <h3 className={`${display} font-bold text-lg mt-3 leading-snug group-hover:underline`}>
                        {isAmharic ? ws.titleAmharic : ws.title}
                      </h3>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                        color: 'var(--app-accent, #4f46e5)'
                      }}
                      className="p-3 rounded-2xl shrink-0"
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {ws.units.map((u) => (
                      <button
                        key={u.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUnit(u.id);
                          onNavigateTab('mindmap');
                        }}
                        className="text-xs px-3 py-2 rounded-full border font-medium hover:shadow-sm transition-all"
                        style={{
                          backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                          borderColor: 'var(--app-border, #cbd5e1)',
                          color: 'var(--app-text, #020617)'
                        }}
                      >
                        {isAmharic ? u.titleAmharic : u.title}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span style={{ color: 'var(--app-text-muted, #475569)' }}>
                        {isAmharic ? 'የተማሩት' : 'Learned'}
                      </span>
                      <span style={{ color: 'var(--app-accent, #4f46e5)' }}>{ws.overallMastery}%</span>
                    </div>
                    <div
                      style={{ backgroundColor: 'var(--app-surface-elevated, #f8fafc)' }}
                      className="w-full h-2 rounded-full overflow-hidden"
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

                <div
                  style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
                  className="pt-5 mt-5 border-t flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (ws.units[0]) onSelectUnit(ws.units[0].id);
                        onNavigateTab('mindmap');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: 'var(--app-accent, #4f46e5)',
                        color: 'var(--app-accent-text, #ffffff)'
                      }}
                    >
                      <Network className="w-3.5 h-3.5" />
                      {isAmharic ? 'ካርታ' : 'Map'}
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
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold border"
                      style={{
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                        borderColor: 'var(--app-border, #cbd5e1)',
                        color: 'var(--app-text, #020617)'
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--app-success, #059669)' }} />
                      {isAmharic ? 'አስተምር' : 'Teach'}
                    </button>
                  </div>
                  <ArrowRight className="w-4 h-4" style={{ color: 'var(--app-text-muted, #475569)' }} />
                </div>
              </div>
            ))}

            {/* Add new book */}
            <div
              onClick={onOpenPdfModal}
              style={{
                backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                borderColor: 'var(--app-border-strong, #94a3b8)'
              }}
              className="rounded-3xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:border-indigo-500 transition-all group"
            >
              <div
                style={{
                  backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                  color: 'var(--app-accent, #4f46e5)'
                }}
                className="p-4 rounded-2xl group-hover:scale-110 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`${display} font-bold`}>
                  {isAmharic ? 'አዲስ መጽሐፍ ያስገቡ' : 'Bring in a new book'}
                </h4>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-sm mt-1 max-w-xs">
                  {isAmharic
                    ? 'የትምህርት መጽሐፍ (PDF) ይምረጡ። አውደ ወደ ካርታ ይቀይረዋል።'
                    : 'Pick a school book (PDF). Awde turns it into a map you can explore.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three simple things you can do */}
        <section className="space-y-5">
          <div className="max-w-xl">
            <h2 className={`${display} text-2xl font-extrabold tracking-tight`}>
              {isAmharic ? 'ሶስት የሚያደርጉዋቸው ነገሮች' : 'Three things you can do'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Network className="w-5 h-5" />,
                title: isAmharic ? '1. ይመልከቱ' : '1. See the map',
                desc: isAmharic
                  ? 'ሀሳቦች እንዴት እንደሚገናኙ ይመልከቱ።'
                  : 'See how each idea connects to the next.'
              },
              {
                icon: <MessageSquare className="w-5 h-5" />,
                title: isAmharic ? '2. ያስረዱ' : '2. Explain it',
                desc: isAmharic
                  ? 'ለሩቲ በራስዎ ቃላት ያስረዱ።'
                  : 'Teach Rooty in your own words.'
              },
              {
                icon: <FlaskConical className="w-5 h-5" />,
                title: isAmharic ? '3. ይለኩ' : '3. See your progress',
                desc: isAmharic
                  ? 'ምን ያህል እንደተማሩ ይመልከቱ።'
                  : 'Check how much you actually remember.'
              }
            ].map((it, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="p-6 rounded-3xl border space-y-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                    color: 'var(--app-accent, #4f46e5)'
                  }}
                >
                  {it.icon}
                </div>
                <h3 className={`${display} font-bold text-base`}>{it.title}</h3>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-sm leading-relaxed">
                  {it.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
