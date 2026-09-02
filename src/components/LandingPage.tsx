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
  Zap,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Users,
  Clock,
  Globe
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
      ? 'እውቀትን፣ ዘር "አውደ" ትብትብ እንዴት እንዲያድግ ያድርጉ'
      : 'Seed ideas grow into connected knowledge.',
    sub: isAmharic
      ? 'የመጽሐፋቸውን ጽንሰ-ሀሳቦች በእይታ ካርታ እና በፈይንድማን ውይይት ይገንቡ፣ ያስረዱና ያረጋግጡ።'
      : 'Turn any textbook into interactive mind-maps and Socratic Feynman mastery. Understand deeply, not just memorize.',
    cta: isAmharic ? 'ወደ መስሪያ ቦታ ግባ' : 'Enter the Workspace',
    ctaSub: isAmharic ? 'ነጻ፣ ኦፍላይን የሚሰራ፣ ለደካማ የኢንተርኔት ግንኙነት የተበጀ' : 'Free • Works offline • Built for low-bandwidth networks',

    // Problem statement section
    problemTitle: isAmharic
      ? 'ግዴታ፡ ባህላዊ ትምህርት እና የእውቀት ክፍተት'
      : 'The Gap: Traditional Learning vs. Mastery-Driven Learning',
    problemDesc: isAmharic
      ? 'ተማሪዎች ዛሬ በቀጠሮ የሚነበቡ እና የሚተሙ መጽሐፍት ላይ ብቻ የተመሰረተ ትምህርት ይጠቀማሉ። ወዲያውኑ ግብረመልስ የለም፣ የባህል ጠቀሜታ የለም፣ እና የተማሩት እውነተኛ ውጤት እንዳለ ለመለካት ምንም መንገድ የለም። ውጤቱም፡ ዝቅተኛ ማስታወስ፣ መሰረታዊ ተሳትፎ፣ እና ትምህርት ቤቶች የሚያስተምሩት እና ተማሪዎች ማጠናቀቅ ያለባቸው መካከል ያለው ክፍተት እየሰፋ መጥቷል።'
      : 'Students today rely on static textbooks that force rote-reading and memorization. There is no immediate feedback, no cultural relevance, and no way to measure whether the learning actually sticks. The result: low retention, disengagement, and a widening gap between what schools teach and what learners need to master.',

    solutionTitle: isAmharic
      ? 'አውደ (Awde) እንዴት ይፈታል'
      : 'How Awde Bridges the Gap',
    solutionDesc: isAmharic
      ? 'አውደ ማንኛውንም የመጽሐፍ አንዱን በሁለት ቋንቋ ወደ ተንቀሳቃሽ ማይንድ-ማፕ ይቀይራል፣ ለትኩረት ግብረመልስ ሶቅራጥስ ፈይንድማን ውይይት (Rooty) ያቀርባል፣ እና ከተማሩ በፊት እና ከተማሩ በኋላ ያለውን ማስታወስ በመለካት ላይ የተመሰረተ ዳታ የሚነካካ ላብራቶሪ ይሰጣል። የመድረኩ ሁኔታ ለደካማ ኢንተርኔት አውቶበስ ተስማሚ ነው፣ ሙሉ በሙሉ ኦፍላይን ይሰራል፣ እና እያንዳንዱን ምሳሌ በኢትዮጵያ ባህላዊ አውደ ጽንሰ-ሀሳብ ውስጥ ያስቀምጣል።'
      : 'Awde addresses these pain points by turning any textbook into a bilingual, interactive mind-map, providing Socratic Feynman dialogue (Rooty) for instant conceptual feedback, and a data-driven efficacy lab that quantifies before-and-after recall. The platform is built for low-bandwidth environments, works fully offline, and grounds every analogy in Ethiopian cultural context, closing the gap between reality and ideal.',

    statsTitle: isAmharic ? 'በቁጥር የሚታይ ለውጥ' : 'Measurable Impact',
    pillarsTitle: isAmharic ? 'እንዴት ይሰራል' : 'How it works',
    trustTitle: isAmharic ? 'ለምን አውደ (Awde)?' : 'Why Awde?'
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

  const stats = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      value: '+58%',
      label: isAmharic ? 'የማስታወስ መጨመር' : 'Average Recall Improvement',
      color: 'text-emerald-500'
    },
    {
      icon: <Users className="w-4 h-4" />,
      value: '100%',
      label: isAmharic ? 'ኦፍላይን የሚሰራ' : 'Offline Capable',
      color: 'text-blue-500'
    },
    {
      icon: <Clock className="w-4 h-4" />,
      value: '< 3s',
      label: isAmharic ? 'ፈጣን ምላሽ' : 'Instant Feedback',
      color: 'text-amber-500'
    },
    {
      icon: <Globe className="w-4 h-4" />,
      value: '2',
      label: isAmharic ? 'ቋንቋዎች (EN + AM)' : 'Languages (EN + AM)',
      color: 'text-indigo-500'
    }
  ];

  const realityVsIdeal = [
    {
      reality: isAmharic ? 'ቀጠሮ የሚነበብ መጽሐፍ' : 'Static textbook reading',
      ideal: isAmharic ? 'ተንቀሳቃሽ የእይታ ካርታ' : 'Interactive mind-maps'
    },
    {
      reality: isAmharic ? 'የማይቀርብ ግብረመልስ' : 'No immediate feedback',
      ideal: isAmharic ? 'ወዲያውኑ የሩቲን ግብረመልስ' : 'Instant Rooty feedback'
    },
    {
      reality: isAmharic ? 'የማይለካ ውጤት' : 'Unmeasurable outcomes',
      ideal: isAmharic ? 'ዳታ-ተኮር የውጤት መለኪያ' : 'Data-driven efficacy tracking'
    },
    {
      reality: isAmharic ? 'ከባህል የራቀ' : 'Culturally disconnected',
      ideal: isAmharic ? 'በኢትዮጵያ ባህል የተመሰረተ' : 'Ethiopian-contextualized'
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
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-10 sm:py-16 flex flex-col gap-10 sm:gap-14">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <AwdeLogo size="lg" isAmharic={isAmharic} />
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

        {/* Hero Section */}
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

        {/* Stats Bar */}
        <div
          style={{
            backgroundColor: 'var(--app-surface, #ffffff)',
            borderColor: 'var(--app-border, #cbd5e1)'
          }}
          className="rounded-2xl border p-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`flex items-center justify-center gap-1 mb-1 ${stat.color}`}>
                {stat.icon}
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">{stat.value}</span>
              </div>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Problem Statement Section */}
        <div className="space-y-8">
          <div
            style={{
              backgroundColor: 'var(--app-surface, #ffffff)',
              borderColor: 'var(--app-border, #cbd5e1)'
            }}
            className="rounded-3xl border p-8 sm:p-10 shadow-sm"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--app-accent, #4f46e5)' }}>
                  {t.problemTitle}
                </h2>
                <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {t.problemDesc}
                </p>
              </div>

              {/* Reality vs Ideal Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="space-y-3">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {isAmharic ? 'አሁን ያለው ሁኔታ (Reality)' : 'Current Reality'}
                  </h3>
                  <div className="space-y-2">
                    {realityVsIdeal.map((item, i) => (
                      <div
                        key={i}
                        style={{ backgroundColor: 'var(--app-surface-elevated, #f8fafc)' }}
                        className="flex items-center gap-2 p-3 rounded-lg text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span style={{ color: 'var(--app-text-muted, #475569)' }}>{item.reality}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAmharic ? 'የአውደ መፍትሔ (Ideal)' : 'Awde Solution'}
                  </h3>
                  <div className="space-y-2">
                    {realityVsIdeal.map((item, i) => (
                      <div
                        key={i}
                        style={{ backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.06))' }}
                        className="flex items-center gap-2 p-3 rounded-lg text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span style={{ color: 'var(--app-text, #020617)' }}>{item.ideal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solution Section */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--app-accent, #4f46e5)' }}>
              {t.solutionTitle}
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
              {t.solutionDesc}
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="space-y-4">
          <h2 className="text-center text-lg flex items-center justify-center gap-2 font-bold">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            {t.pillarsTitle}
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
        <div className="space-y-3">
          <h3 className="text-center text-sm font-bold" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {t.trustTitle}
          </h3>
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

        {/* Footer */}
        <div className="text-center pt-4 border-t" style={{ borderColor: 'var(--app-border, #cbd5e1)' }}>
          <p className="text-xs" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic
              ? '© 2024 አውደ (Awde) — ለኢትዮጵያ ተማሪዎች የተሰራ የእውቀት ማዳበሪያ'
              : '© 2024 Awde — Cognitive Mastery Platform for Ethiopian STEM Students'}
          </p>
        </div>
      </div>
    </div>
  );
};
