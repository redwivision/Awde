import React from 'react';
import {
  Network,
  MessageSquare,
  FlaskConical,
  Wifi,
  ArrowRight,
  Languages,
  ShieldCheck,
  Palette,
  BookOpen,
  TrendingUp,
  Globe,
  GraduationCap,
  Puzzle,
  Hammer,
  Sparkles,
  XCircle,
  CheckCircle2,
  ArrowDown,
  Zap,
  Download
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { DesignAesthetic, LanguageMode } from '../types';
import { AwdeLogo } from './AwdeLogo';
import { AestheticsModal } from './AestheticsModal';

interface LandingPageProps {
  language: LanguageMode;
  onToggleLanguage: () => void;
  onEnterWorkspace: () => void;
  workspacesCount: number;
  currentAesthetic: DesignAesthetic;
  onSelectAesthetic: (aesthetic: DesignAesthetic) => void;
}

/* A tiny helper that fades + lifts content in as it scrolls into view. */
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Awde landing page — a cinematic, story-driven narrative gate.
 *
 * The story arc:
 *   1. HERO   — The exam is the goal. But is a grade the same as knowing?
 *   2. REALITY — Students chase the grade, not the knowledge. The exam is the
 *                finish line and also the end of the road.
 *   3. GAPS   — Three root causes: the system, one-size-fits-all, no application.
 *   4. COST   — Knowledge leaks away; curiosity itself is eroded.
 *   5. BRIDGE — Awde is the bridge that connects exam-performance to true
 *                understanding, wakefulness returned to learning.
 *   6. HOW IT WORKS / TRUST — pillars, evidence, and the way in.
 */
export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onToggleLanguage,
  onEnterWorkspace,
  workspacesCount,
  currentAesthetic,
  onSelectAesthetic
}) => {
  const isAmharic = language === 'am';
  const [isAestheticsModalOpen, setIsAestheticsModalOpen] = React.useState(false);

  const heroRef = React.useRef<HTMLDivElement>(null);
  const heroScroll = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(heroScroll.scrollYProgress, [0, 0.35], [1, 0.1]);

  // ---- Narrative copy (bilingual) ----

  const hero = {
    eyebrow: isAmharic ? 'ለኢትዮጵያ ተማሪዎች የተሰራ የማስተዋል መድረክ' : 'A learning platform for Ethiopian STEM students',
    titleA: isAmharic ? 'ውጤት ማግኘት ማለት' : 'Getting the grade',
    titleB: isAmharic ? 'መረዳት አይደለም።' : 'is not understanding.',
    sub: isAmharic
      ? 'አብዛኛው ጊዜ የምናጠናው ፈተናውን ለማለፍ ነው — እውቀቱን ለመቆጣጠር አይደለም። አውደ በውጤት እና በእውነተኛ እውቀት መካከል ያለውን ድልድይ ይገነባል።'
      : 'We study to pass the exam, not to own the knowledge. Awde is the bridge that spans the distance between a grade and real understanding.',
    meta: isAmharic ? 'ነጻ • ሳውቀው ያስቀምጣል • ለደካማ ኢንተርኔት የተበጀ' : 'Free • Keeps your study saved locally • Built for low-bandwidth networks',
    cta: isAmharic ? 'ድልድዩን ይሻገሩ — ይግቡ' : 'Cross the bridge — Enter',
    scrollHint: isAmharic ? 'ወደ ታች ይሸብልሉ' : 'Scroll to read the story'
  };

  const reality = {
    kicker: isAmharic ? 'እውነታው' : 'The Reality',
    title: isAmharic
      ? 'የምናጠናው ለፈተና ነው፣ ለህይወት አይደለም'
      : 'We study for the exam, not for the life after it',
    body: isAmharic
      ? 'ብዙ ተማሪዎች ለፈተና ይዘጋጃሉ። "ውጤቱ ምን ይሆን?" የሚለው ጭንቀት እና የማለፍ ግፊት ነው ሁሉንም ሀሳብ የሚወስደው። ፈተናው ተጠናቆ፣ ውጤቱ ወጥቶ፣ ማለቂያው ሲደርስ — የተማርነው ነገር ከትምህርት ቤት እንዳወጣን ይረሳል። እውቀት የሚያድግበት ነገር ሳይሆን ጊዜያዊ ውጤት ለማግኘት የምንጠቀምበት መሳሪያ ሆኗል።'
      : 'Ask a student what they are studying for and the answer is almost always the same: the exam. The anxiety is about the score, the pressure is about passing. When the paper is turned in and the grade arrives, it is the finish line — and also the end of the road. Most of what was "learned" evaporates as fast as it was crammed. Knowledge, which should be something that grows, has been reduced to a temporary tool for a temporary score.',
    highlight: isAmharic
      ? 'ይህ የተማሪዎች ጉድለት ብቻ አይደለም — የስርዓቱ ውጤት ነው።'
      : "This isn't a student's failing. It's the system's design."
  };

  const gapsTitle = isAmharic
    ? 'በዚህ መሃል ያሉት ሦስቱ ክፍተቶች'
    : 'The three gaps standing between teaching and understanding';
  const gapsIntro = isAmharic
    ? 'ተማሪው ወይም እውቀቱ አይደለም ችግሩ — ክፍተቶቹ በስርዓቱ ውስጥ ነው። እውቀት ለማዳበር የሚያደናቅፉ ሦስት መሰናክሎች አሉ።'
    : "The problem isn't the student, and it isn't the knowledge. The gaps are in the system. Three walls stand between teaching and understanding.";

  const gaps = [
    {
      num: '01',
      icon: <GraduationCap className="w-6 h-6" />,
      title: isAmharic ? 'ስርዓቱ ራሱ' : 'The system itself',
      desc: isAmharic
        ? 'ስርዓቱ የሚለካው በውጤት ነው፣ በመረዳት አይደለም። ኮርሱ ጋር የሚገጣጠም ነገር ለመጻፍ የሚያስችል በቂ ነገር "ማወቅ" ብቻ በቂ ነው። ስለዚህ ተማሪዎች የሚያጠኑት ነገሩን ለመረዳት ሳይሆን የሚገመገሙበትን ነገር ለማስተካከል ነው።'
        : 'The system is measured on scores, not understanding. To pass, it is enough to know just enough to reproduce what is graded. So students optimize for the assessment — teaching to the test becomes teaching to survive.',
      point: isAmharic ? 'ተማሪዎች ከማስተማር ይልቅ ለመፈተን ይማራሉ።' : 'Students learn to be tested, not to be taught.'
    },
    {
      num: '02',
      icon: <Puzzle className="w-6 h-6" />,
      title: isAmharic ? 'ለሁሉም አንድ አይነት መንገድ' : 'One method for every mind',
      desc: isAmharic
        ? 'እያንዳንዱ ተማሪ የተለየ የማስተዋል መንገድ አለው — አንዱ በእይታ፣ አንዱ በመስማት፣ አንዱ በመስራት ይማራል። ነገር ግን ትምህርት ለሁሉም በአንድ መንገድ ይሰጣል። ክፍሉ በዚያ መንገድ የማይረዳው ተማሪ በኋላ ይቀራል — ችሎታው ስለሌለው ሳይሆን ትምህርቱ የሚሰማራው ወደ አእምሮው ስላልሆነ።'
        : "Every mind learns differently — some see it, some hear it, some must build it to believe it. But the lesson is delivered one way to a room of many minds. The student who can't climb that single ladder is left behind — not for lack of ability, but because the lesson was never shaped for how they think.",
      point: isAmharic ? 'አንድ አይነት ንግግር ለሁሉም አእምሮ አይሰማም።' : 'One lecture does not fit every mind.'
    },
    {
      num: '03',
      icon: <Hammer className="w-6 h-6" />,
      title: isAmharic ? 'እውቀትን ተግባራዊ የማድረግ እድል የለም' : 'No chance to use the knowledge',
      desc: isAmharic
        ? '"ጨቅጭቅ" ያለ ማስታወስ እና የቀመር ማንበብ — እውቀትን የሚፈትኑ እድሎች ብዙም የሉም። ተማሪዎች በተግባር የማስተማር፣ የማብራራት እና የመጠቀም እድል ከሌላቸው ሀሳብን ለመረዳት በጭራሽ አይተማመኑም። ሳይሰሩት ያለው ነገር በቀላሉ ይረሳል።'
        : 'There is cramming and there is recalling, but almost never an invitation to actually use what was learned. No chance to teach it, explain it, apply it. A student who never has to use an idea never has to truly understand it — and what is never used is soon forgotten.',
      point: isAmharic ? 'ጥቅም ላይ ያልዋለ እውቀት ህልውና የለውም።' : 'Knowledge that is never used does not survive.'
    }
  ];

  const cost = {
    kicker: isAmharic ? 'ዋጋው' : 'The Cost',
    title: isAmharic
      ? 'ውጤቱ ሲወጣ፣ እውቀቱ ይርሳል። ከዚያም መማር ራሱ ይራባል።'
      : 'When the grade lands, the knowledge fades. Then learning itself feels pointless.',
    body: isAmharic
      ? 'የማጥናት ጉጉት የሚቀጣጠለው በመረዳት ደስታ ነው። ውጤቱ ብቻውን ግብ ሲሆን፣ ያ ደስታ ይጠፋል። ተማሪዎች እንኳን አይማሩም — ይህ ለምን እንደሆነ ሲያስቡ የሚገኘው ምንም የለም።'
      : "The love of learning is fueled by the joy of understanding. When the score becomes the only goal, that joy dies. Students don't just learn less — they stop wanting to learn at all, because nothing in the system tells them what the learning was for."
  };

  const bridge = {
    kicker: isAmharic ? 'አውደ — ድልድዩ' : 'Awde — The Bridge',
    title: isAmharic
      ? 'ከጊዜያዊ ውጤት ወደ ዘላቂ እውቀት'
      : 'From temporary performance to lasting understanding',
    shoreReal: isAmharic ? 'የውጤት ባንክ፡ ማለፍና ማመልከት' : 'The shore of grades: pass and repeat',
    shoreIdeal: isAmharic ? 'የእውቀት ባንክ፡ መረዳትና መጠቀም' : 'The shore of mastery: understand and use',
    body: isAmharic
      ? 'አውደ ሁለቱን ዳርቻዎች የሚያገናኝ ድልድይ ነው። ማንኛውንም መጽሐፍ ወደ ተንቀሳቃሽ የእይታ ካርታ ይቀይራል፣ "ሩቲ" የተባለ የሶቅራጥስ ተማሪ ይሰጣል — እውቀትህን በምትጠይቅበት እና ጥያቄ በሚጠይቅበት — እና ከመማር በፊት እና በኋላ ያለውን ልዩነት ይለካል። በዚህ መንገድ ተማሪው እውቀቱን መጠቀም ይማራል፣ ውጤቱን ብቻ ሳይሆን ነገሩን መረዳት ይጀምራል።'
      : 'Awde is the bridge built between those two shores. Any textbook becomes an interactive mind-map you can explore. A Socratic student named Rooty challenges you to teach the idea back in plain words — which is how you find out what you actually know. And a method laboratory measures your recall before and after, so you can see that real understanding — not just a score — is forming. This is learning you can use, not just a number to report.'
  };

  // Match each gap to its Awde solution (story-driven, not a table).
  const bridges = [
    {
      icon: <Network className="w-5 h-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      stemming: isAmharic ? 'ለስርዓቱ ክፍተት' : 'Against the system gap',
      title: isAmharic ? 'የእይታ ካርታ' : 'Mind-Maps that reward structure',
      desc: isAmharic
        ? 'ማስታወስን ሳይሆን ግንኙነቶችን ይፈትናል። ምክንያቱም ስለተፈተኑ ሳይሆን ስለተገነዘቡ ትጠናለህ።'
        : 'Exams reward reproduction; maps reward relationships. You learn for the connections, not the marks.'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      stemming: isAmharic ? 'ለአንድ-መንገድ ክፍተት' : 'Against the one-method gap',
      title: isAmharic ? 'ሶቅራጥስ ሩቲ' : 'Socratic Rooty talks the way you think',
      desc: isAmharic
        ? 'ማብራራት፣ መጠየቅ፣ ማስተማር — እውቀትን ወደ አእምሮህ መንገድ የሚያደርስ።'
        : 'Explain, question, teach — meeting knowledge on the path your mind actually travels.'
    },
    {
      icon: <FlaskConical className="w-5 h-5" />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      stemming: isAmharic ? 'ለተግባራዊነት ክፍተት' : 'Against the no-application gap',
      title: isAmharic ? 'የውጤታማነት ላብራቶሪ' : 'A lab that makes you use it',
      desc: isAmharic
        ? 'ከመማር በፊት እና በኋላ ማስታወስዎን ይለካል — እውቀት እየገነባህ መሆኑን በተግባር ያረጋግጣል።'
        : 'Measures recall before and after, proving the knowledge is actually being built and used.'
    }
  ];

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
      value: '📈',
      label: isAmharic ? 'የማስታወስ ለውጥ ተለክቷል' : 'Measures your real recall before & after',
      color: 'text-emerald-500'
    },
    {
      icon: <Zap className="w-4 h-4" />,
      value: '0',
      label: isAmharic ? 'የኤፒአይ ቁልፍ አያስፈልግም' : 'API keys required',
      color: 'text-blue-500'
    },
    {
      icon: <Download className="w-4 h-4" />,
      value: 'on-device',
      label: isAmharic ? 'ጥናትዎ በመሳሪያዎ ላይ ተቀምጧል' : 'Study saved on your device',
      color: 'text-amber-500'
    },
    {
      icon: <Globe className="w-4 h-4" />,
      value: '2',
      label: isAmharic ? 'ቋንቋዎች (EN + AM)' : 'Languages (EN + AM)',
      color: 'text-indigo-500'
    }
  ];

  const trust = [
    { icon: <Languages className="w-4 h-4" />, label: isAmharic ? 'እንግሊዝኛ + አማርኛ' : 'English + Amharic' },
    { icon: <ShieldCheck className="w-4 h-4" />, label: isAmharic ? 'መረጃዎ በእርስዎ ላይ' : 'Your data stays local' },
    { icon: <Wifi className="w-4 h-4" />, label: isAmharic ? 'ያለ ቁልፍ ይሰራል' : 'Works without an AI key' }
  ];

  return (
    <div
      ref={heroRef}
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)',
        fontFamily: 'inherit'
      }}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8">

        {/* ============ TOP BAR ============ */}
        <div className="flex items-center justify-between gap-3 py-6">
          <AwdeLogo size="lg" isAmharic={isAmharic} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAestheticsModalOpen(true)}
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              aria-label={isAmharic ? 'የዲዛይን ገጽታ ይምረጡ' : 'Choose design aesthetic'}
            >
              <Palette className="w-4 h-4 text-emerald-500" />
              {isAmharic ? 'ገጽታ' : 'Theme'}
            </button>
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
        </div>

        {/* ============ HERO ============ */}
        <motion.section
          style={{ opacity: heroOpacity }}
          className="relative min-h-[76vh] flex flex-col items-center justify-center text-center max-w-4xl mx-auto"
        >
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
              color: 'var(--app-accent, #4f46e5)',
              borderColor: 'var(--app-border-strong, #94a3b8)'
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.02]"
          >
            {hero.titleA}
            <span className="block mt-1" style={{ color: 'var(--app-accent, #4f46e5)' }}>
              {hero.titleB}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.28 }}
            style={{ color: 'var(--app-text-muted, #475569)' }}
            className="mt-6 text-base sm:text-xl leading-relaxed max-w-2xl"
          >
            {hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="pt-7 flex flex-col items-center gap-4"
          >
            <button
              onClick={onEnterWorkspace}
              style={{
                backgroundColor: 'var(--app-accent, #4f46e5)',
                color: 'var(--app-accent-text, #ffffff)'
              }}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:opacity-90 hover:scale-[1.03] transition-all"
            >
              {hero.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span
              style={{ color: 'var(--app-text-muted, #475569)' }}
              className="text-xs font-medium"
            >
              {hero.meta}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            <span className="text-[11px] font-medium">{hero.scrollHint}</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ============ THE REALITY ============ */}
        <section className="relative py-20 sm:py-28">
          <Reveal className="max-w-3xl mx-auto text-center">
            <span
              style={{ color: 'var(--app-accent, #4f46e5)' }}
              className="text-xs font-bold uppercase tracking-[0.2em]"
            >
              {reality.kicker}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {reality.title}
            </h2>
            <div className="mt-8 mx-auto max-w-2xl space-y-4 text-left">
              {isAmharic ? (
                <p className="leading-relaxed text-base sm:text-lg" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {reality.body}
                </p>
              ) : (
                <p className="leading-relaxed text-base sm:text-lg" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {reality.body}
                </p>
              )}
              <p
                className="pt-2 text-base sm:text-lg font-semibold"
                style={{ color: 'var(--app-accent, #4f46e5)' }}
              >
                {reality.highlight}
              </p>
            </div>
          </Reveal>
        </section>

        {/* ============ THE GAPS ============ */}
        <section className="py-12 sm:py-16">
          <Reveal className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {gapsTitle}
            </h2>
            <p
              className="mt-4 text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {gapsIntro}
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {gaps.map((gap, i) => (
              <motion.div
                key={gap.num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="relative p-6 sm:p-7 rounded-3xl border overflow-hidden group"
              >
                <div
                  className="absolute -top-9 -right-9 w-28 h-28 rounded-full opacity-[0.07] group-hover:opacity-[0.14] transition-opacity"
                  style={{ backgroundColor: 'var(--app-accent, #4f46e5)' }}
                />
                <div
                  className="text-xs font-black tracking-widest"
                  style={{ color: 'var(--app-text-muted, #475569)' }}
                >
                  {gap.num}
                </div>
                <div
                  className="mt-3 w-11 h-11 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500"
                >
                  {gap.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug">{gap.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--app-text-muted, #475569)' }}
                >
                  {gap.desc}
                </p>
                <p className="mt-4 text-sm font-semibold flex items-start gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span style={{ color: 'var(--app-text, #020617)' }}>{gap.point}</span>
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ THE COST ============ */}
        <section className="relative py-20 sm:py-24">
          <div
            className="absolute inset-x-0 top-0 bottom-0 -z-10"
            style={{
              background:
                'linear-gradient(180deg, transparent, var(--app-accent-bg, rgba(79,70,229,0.06)), transparent)'
            }}
          />
          <Reveal className="max-w-3xl mx-auto text-center">
            <span
              style={{ color: 'var(--app-accent, #4f46e5)' }}
              className="text-xs font-bold uppercase tracking-[0.2em]"
            >
              {cost.kicker}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {cost.title}
            </h2>
            <p
              className="mt-6 mx-auto max-w-2xl text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {cost.body}
            </p>
          </Reveal>
        </section>

        {/* ============ THE BRIDGE (Awde solution) ============ */}
        <section className="py-12 sm:py-16">
          <Reveal className="max-w-3xl mx-auto text-center">
            <span
              style={{ color: 'var(--app-accent, #4f46e5)' }}
              className="text-xs font-bold uppercase tracking-[0.2em]"
            >
              {bridge.kicker}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {bridge.title}
            </h2>
            <p
              className="mt-6 mx-auto max-w-2xl text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {bridge.body}
            </p>
          </Reveal>

          {/* The visual bridge: two shores joined by Awde's three pillars */}
          <div className="mt-14">
            <div
              className="rounded-3xl border p-6 sm:p-8 overflow-hidden"
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)'
              }}
            >
              {/* Shore labels above */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4">
                <div className="text-left sm:max-w-[38%]">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> {isAmharic ? 'የውጤት ጎን' : 'Score-side'}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold leading-snug">
                    {bridge.shoreReal}
                  </p>
                </div>
                <div className="shrink-0 py-2 text-left sm:flex-1 sm:py-0 sm:text-center sm:px-3">
                  <span className="inline-block rounded-full text-[10px] sm:text-xs font-bold px-3 py-1"
                    style={{
                      backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                      color: 'var(--app-accent, #4f46e5)'
                    }}
                  >
                    {isAmharic ? 'አውደ ድልድይ' : 'Awde Bridge'}
                  </span>
                </div>
                <div className="text-left sm:max-w-[38%] sm:text-right">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5 sm:justify-end">
                    {isAmharic ? 'የእውቀት ጎን' : 'Mastery-side'} <CheckCircle2 className="w-3.5 h-3.5" />
                  </p>
                  <p className="mt-1 text-xs sm:text-sm font-semibold leading-snug">
                    {bridge.shoreIdeal}
                  </p>
                </div>
              </div>

              {/* The bridge spans — three pillars as cables */}
              <div className="relative">
                {/* faint background arch */}
                <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
                  style={{ background: 'var(--app-accent-bg, rgba(79,70,229,0.20))' }}
                />
                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {bridges.map((b, i) => (
                    <motion.div
                      key={b.title}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.12 }}
                      style={{
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                        borderColor: 'var(--app-border, #cbd5e1)'
                      }}
                      className="relative border rounded-2xl p-5 text-center hover:-translate-y-1 hover:shadow-md transition-all"
                    >
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--app-text-muted, #475569)' }}
                      >
                        {b.stemming}
                      </span>
                      <div className={`mt-3 mx-auto w-11 h-11 rounded-xl ${b.bg} ${b.color} flex items-center justify-center`}>
                        {b.icon}
                      </div>
                      <h4 className="mt-3 font-bold text-sm leading-snug">{b.title}</h4>
                      <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                        {b.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS (pillars) ============ */}
        <section className="py-4 sm:py-8 space-y-6">
          <Reveal className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              {isAmharic ? 'እንዴት ይሰራል' : 'How it works'}
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
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
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ STATS ============ */}
        <section className="pt-10 sm:pt-14">
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
        </section>

        {/* ============ TRUST ============ */}
        <section className="py-10 space-y-3">
          <h3 className="text-center text-sm font-bold" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic ? 'ለምን አውደ (Awde)?' : 'Why Awde?'}
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
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-16 sm:py-20">
          <Reveal className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {isAmharic
                ? 'ከውጤት ባሻገር ማወቅ ጀምር።'
                : 'Start knowing, not just passing.'}
            </h2>
            <p
              className="mt-4 text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {isAmharic
                ? 'አውደ ወደ ዘላቂ እውቀት የሚመራው ድልድይ ነው። ከመጨረሻው ውጤት ባሻገር የሚቆይ መረዳት በመገንባት ጀምር።'
                : 'Awde is the bridge to knowledge that outlasts the final exam. Start building an understanding that stays.'}
            </p>
            <button
              onClick={onEnterWorkspace}
              style={{
                backgroundColor: 'var(--app-accent, #4f46e5)',
                color: 'var(--app-accent-text, #ffffff)'
              }}
              className="group mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:opacity-90 hover:scale-[1.03] transition-all"
            >
              {isAmharic ? 'ድልድዩን ይሻገሩ — ይግቡ' : 'Cross the bridge — Enter'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Reveal>
        </section>

        {/* ============ FOOTER ============ */}
        <div className="text-center pt-6 pb-10 border-t" style={{ borderColor: 'var(--app-border, #cbd5e1)' }}>
          <p className="text-xs" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic
              ? '© 2024 አውደ (Awde) — ለኢትዮጵያ ተማሪዎች የተሰራ የእውቀት ማዳበሪያ'
              : '© 2024 Awde — Cognitive Mastery Platform for Ethiopian STEM Students'}
          </p>
        </div>
      </div>
      <AestheticsModal
        isOpen={isAestheticsModalOpen}
        onClose={() => setIsAestheticsModalOpen(false)}
        currentAesthetic={currentAesthetic}
        onSelectAesthetic={onSelectAesthetic}
        language={language}
      />
    </div>
  );
};
