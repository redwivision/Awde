import React from 'react';
import {
  Network,
  MessageSquare,
  FlaskConical,
  Wifi,
  ArrowRight,
  Languages,
  ShieldCheck,
  BookOpen,
  Zap
} from 'lucide-react';
import { LanguageMode } from '../types';
import { AwdeLogo } from './AwdeLogo';

interface LandingPageProps {
  language: LanguageMode;
  onToggleLanguage: () => void;
  onEnterWorkspace: () => void;
  workspacesCount: number;
}

/**
 * Awde landing page — a cinematic first-run gate that showcases the product
 * promise before entering the workspace. Fully themable via --app-* CSS vars
 * and bilingual (English / Amharic). The "Enter" choice is persisted so it
 * appears once, acting as a reusable marketing/landing hero.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onToggleLanguage,
  onEnterWorkspace,
  workspacesCount
}) => {
  const isAmharic = language === 'am';
  const t = {
    badge: isAmharic ? 'ለኢትዮጵያ የተሰራ የሳይንስ መማሪያ' : 'Built for Ethiopian STEM learners',
    title: isAmharic
      ? 'እውቀትን፣ ዘር ‘አውደ’ ትብትብ እንዴት እንዲያድግ ያድርጉ'
      : 'Seed ideas grow into connected knowledge.',
    sub: isAmharic
      ? 'የመጽሐፋቸውን ጽንሰ-ሀሳቦች በእይታ ካርታ እና በፈይንድማን ውይይት ይገንቡ፣ ያስረዱና ያረጋግጡ።'
      : 'Turn any textbook into interactive mind-maps and Socratic Feynman mastery. Understand deeply, not just memorize.',
    cta: isAmharic ? 'ወደ መስሪያ ቦታ ግባ' : 'Enter the Workspace',
    ctaSub: isAmharic ? 'ነጻ፣ ኦፍላይን የሚሰራ፣ ለደካማ የኢንተርኔት ግንኙነት የተበጀ' : 'Free • Works offline • Built for low-bandwidth networks'
  };

  const pillars = [
    {
      icon: <Network className="w-5 h-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: isAmharic ? 'ባለብዙ-ደረጃ እይታ ካርታ' : 'Multi-Level Mind-Maps',
      desc: isAmharic
        ? 'ከመጽሐፍ እስከ ምዕራፍ እስከ ርዕስ የሚሄድ ጥልቅ ካርታ'
        : 'From book root to topic nodes in a single explorable graph.'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      title: isAmharic ? 'ሶቅራጥስ ፈይንድማን (Rooty)' : 'Socratic Feynman (Rooty)',
      desc: isAmharic
        ? 'በግልጽ ቋንቋ በማስተማር የመረዳት ክፍተቶችን ይዝጉ'
        : 'Teach Rooty in plain words to expose hidden misconceptions.'
    },
    {
      icon: <FlaskConical className="w-5 h-5" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      title: isAmharic ? 'የውጤታማነት ላብራቶሪ' : 'Efficacy Laboratory',
      desc: isAmharic
        ? 'የማስታወስ ልዩነትዎን በሳይንሳዊ መንገድ ይለኩ'
        : 'Measure before-vs-after recall to find what truly works.'
    }
  ];

  const trust = [
    { icon: <Languages className="w-4 h-4" />, label: isAmharic ? 'እንግሊዝኛ + አማርኛ' : 'English + Amharic' },
    { icon: <Wifi className="w-4 h-4" />, label: isAmharic ? 'ኦፍላይን የሚሰራ' : 'Offline-first' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: isAmharic ? 'መረጃዎ በእርስዎ ላይ' : 'Your data stays local' }
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)',
        fontFamily: 'inherit'
      }}
      className="h-screen w-screen overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 sm:py-16 flex flex-col gap-10 sm:gap-14">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <AwdeLogo size="md" isAmharic={isAmharic} />
          <button
            onClick={onToggleLanguage}
            style={{
              backgroundColor: 'var(--app-surface, #ffffff)',
              borderColor: 'var(--app-border, #cbd5e1)',
              color: 'var(--app-text, #020617)'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <Languages className="w-4 h-4 text-emerald-500" />
            {language === 'am' ? 'Switch to English' : 'በአማርኛ ይመልከቱ'}
          </button>
        </div>

        {/* Hero */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <span
            style={{
              backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
              color: 'var(--app-accent, #4f46e5)',
              borderColor: 'var(--app-border-strong, #94a3b8)'
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
          >
            <Zap className="w-3.5 h-3.5" />
            {t.badge}
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
            {t.title}
          </h1>

          <p
            style={{ color: 'var(--app-text-muted, #475569)' }}
            className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
          >
            {t.sub}
          </p>

          <div className="pt-2 flex flex-col items-center gap-3">
            <button
              onClick={onEnterWorkspace}
              style={{
                backgroundColor: 'var(--app-accent, #4f46e5)',
                color: 'var(--app-accent-text, #ffffff)'
              }}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all"
            >
              {t.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span
              style={{ color: 'var(--app-text-muted, #475569)' }}
              className="text-xs"
            >
              {t.ctaSub}
            </span>
          </div>
        </div>

        {/* Visual strip — numbers */}
        <div
          style={{
            backgroundColor: 'var(--app-surface, #ffffff)',
            borderColor: 'var(--app-border, #cbd5e1)'
          }}
          className="rounded-2xl border p-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <Metric value={`${workspacesCount}`} label="Workspaces" />
          <Metric value={'+58%'} label="Recall improvement" />
          <Metric value={'3'} label="Cognitive pillars" />
          <Metric value={'100%'} label="Offline capable" />
        </div>

        {/* Pillars */}
        <div className="space-y-4">
          <h2 className="text-center text-lg flex items-center justify-center gap-2 font-bold">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            {isAmharic ? 'እንዴት ይሰራል' : 'How it works'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map((p) => (
              <div
                key={p.title}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="p-5 rounded-2xl border space-y-2.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${p.bg} ${p.color} flex items-center justify-center`}>
                  {p.icon}
                </div>
                <h3 className="font-bold text-sm">{p.title}</h3>
                <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2">
          {trust.map((item) => (
            <div
              key={item.label}
              style={{ color: 'var(--app-text-muted, #475569)' }}
              className="flex items-center gap-1.5 text-xs font-medium"
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Metric: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</p>
    <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs mt-0.5">
      {label}
    </p>
  </div>
);