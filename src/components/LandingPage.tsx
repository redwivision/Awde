import React from 'react';
import {
  Network,
  MessageSquare,
  FlaskConical,
  ArrowRight,
  Languages,
  Palette,
  Infinity as InfinityIcon,
  ShieldCheck,
  Wifi,
  ArrowDown
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

/* A quiet fade + lift as content scrolls into view. */
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* Editorial display face — a serif stack gives a human, premium voice
   instead of the generic pixel-sans that reads as machine-made. */
const display = "font-display antialiased";

const sectionKicker = "text-[11px] font-semibold uppercase tracking-[0.28em]";

/**
 * Awde landing page — a quiet, editorial manifesto.
 *
 * The arc runs from the familiar (the grade) to the better (understanding):
 *   1. HERO   — "Getting the grade is not understanding."
 *   2. STORY  — why students chase scores; what that costs them.
 *   3. GAPS   — three failures in the system.
 *   4. BRIDGE — Awde's three movements: map, teach, measure.
 *   5. CLOSE  — one invitation.
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
  const heroOpacity = useTransform(heroScroll.scrollYProgress, [0, 0.4], [1, 0.06]);

  const hero = {
    titleA: isAmharic ? 'ውጤት ማግኘት' : 'Getting the grade',
    titleB: isAmharic ? 'መረዳት አይደለም።' : 'is not understanding.',
    sub: isAmharic
      ? 'አብዛኛው ጊዜ የምናጠናው ፈተናውን ለማለፍ ነው — እውቀቱን ለመቆጣጠር አይደለም። አውደ በውጤት እና በእውነተኛ እውቀት መካከል ያለውን ድልድይ ይገነባል።'
      : 'Most of us study to pass the exam, not to keep what we learn. Awde is the bridge between a grade and real understanding.',
    cta: isAmharic ? 'ድልድዩን ይሻገሩ' : 'Cross the bridge',
    scrollHint: isAmharic ? 'ተጨማሪ' : 'More below'
  };

  const story = {
    section: isAmharic ? 'ታሪኩ' : 'The story',
    title: isAmharic
      ? 'የምናጠናው ለፈተና ነው፤'
      : 'We study for the exam.',
    titleB: isAmharic ? 'ለህይወት አይደለም።' : 'Not for the life after it.',
    body: isAmharic
      ? 'ተማሪው ለምን እያጠና እንደሆነ ጠይቁ — መልሱ ሁልጊዜ ፈተናው ነው። ጭንቀቱ ስለ ውጤቱ፣ ግፊቱ ስለ ማለፍ ነው። ወረቀቱ ተጠናቆ፣ ውጤቱ ሲወጣ — መጨረሻው ነው፣ እንዲሁም የመንገዱ መጨረሻ። የተማርነው ነገር በተጨመረበት ፍጥነት ይተናነሳል።'
      : 'Ask a student what they are studying for and the answer is almost always the same: the exam. The worry is about the score, the pressure is about passing. When the paper is turned in and the grade arrives, it is the finish line — and the end of the road. What was "learned" fades as fast as it was crammed.',
    pull: isAmharic
      ? 'እውቀት የሚያድግ ነገር ሳይሆን ጊዜያዊ ውጤት ለማግኘት የምንጠቀምበት መሳሪያ ሆኗል።'
      : 'Knowledge, which should grow with us, has been reduced to a tool for a temporary score.',
    highlight: isAmharic
      ? 'ይህ የተማሪ ጉድለት አይደለም — የስርዓቱ ንድፍ ነው።'
      : "This isn't the student's failing. It's the system's design."
  };

  const gapsTitle = isAmharic
    ? 'ባለመድረስ መካከል ያሉት ሦስቱ ክፍተቶች'
    : 'Three gaps stand between teaching and understanding';
  const gapsIntro = isAmharic
    ? 'ችግሩ ተማሪውም እውቀቱም አይደለም — ክፍተቶቹ በስርዓቱ ውስጥ ናቸው።'
    : "The problem isn't the student, and it isn't the knowledge. The gaps live in the system.";

  const gaps = [
    {
      num: '01',
      title: isAmharic ? 'ስርዓቱ ራሱ' : 'The system itself',
      desc: isAmharic
        ? 'ስርዓቱ የሚለካው በውጤት ነው፣ በመረዳት አይደለም። ለማለፍ የሚገመገመውን ነገር ማወቅ በቂ ነው። ተማሪዎች ለፈተናው ይማራሉ፣ ለስርዓቱ አይደለም።'
        : 'Measured on scores, not understanding. To pass, it is enough to reproduce what is graded — so students optimize for the test, not for knowing.',
      point: isAmharic ? 'ለመፈተን ይማራሉ፣ ለማስተማር ሳይሆን።' : 'They learn to be tested, not to be taught.'
    },
    {
      num: '02',
      title: isAmharic ? 'ለሁሉም አንድ አይነት መንገድ' : 'One method for every mind',
      desc: isAmharic
        ? 'እያንዳንዱ አእምሮ የተለየ በሆነ መንገድ ይማራል። ነገር ግን ትምህርት በአንድ መንገድ ለብዙ አእምሮዎች ይሰጣል። ያንን ነጠላ መሰላል የማይወጣው ተማሪ ይቀራል።'
        : 'Every mind learns differently — some see it, some hear it, some must build it to believe it. But the lesson is delivered one way to a room of many minds.',
      point: isAmharic ? 'አንድ ንግግር ለሁሉም አእምሮ አይሰማም።' : 'One lecture does not fit every mind.'
    },
    {
      num: '03',
      title: isAmharic ? 'እውቀትን የመጠቀም እድል የለም' : 'No chance to use the knowledge',
      desc: isAmharic
        ? 'ማስታወስ እና ማስታወስ አለ — ነገር ግን የተማረውን ለመጠቀም ግብዣ የለም። ተማሪዎች እውቀታቸውን ለማስተማር፣ ለማብራራት፣ ለመጠቀም እድል ከሌላቸው በጭራሽ በእውነት መረዳት አይገደዱም።'
        : 'There is cramming and there is recalling, but almost never an invitation to actually use what was learned.',
      point: isAmharic ? 'ያልተጠቀምነው እውቀት አይቆይም።' : 'Knowledge that is never used does not survive.'
    }
  ];

  const bridge = {
    section: isAmharic ? 'አውደ — ድልድዩ' : 'Awde — the bridge',
    title: isAmharic
      ? 'ከጊዜያዊ ውጤት ወደ ዘላቂ እውቀት'
      : 'From temporary performance to lasting understanding',
    body: isAmharic
      ? 'ማንኛውም መጽሐፍ ወደ መጓዝ የሚችሉበት የእይታ ካርታ ይሆናል። ሩቲ የተባለ የሶቅራጥስ ተማሪ ሀሳቡን በግልጽ ቃላት እንድታስተምረው ይጠይቃል — ይህም በእውነት የምታውቀውን የሚገልጽ ነው። እና የጥናት ላብራቶሪ ከመማርዎ በፊት እና በኋላ ማስታወስዎን ይለካል።'
      : 'Any textbook becomes a map you can explore. A Socratic student named Rooty challenges you to teach the idea back in plain words — which is how you find out what you actually know. And a method lab measures your recall before and after, so you can see real understanding forming, not just a score.'
  };

  /* Awde's three movements — map, teach, measure. This single, focused
     section replaces the old "bridges", "how it works", and "stats" blocks,
     cutting the clutter and the repetition. */
  const movements = [
    {
      icon: <Network className="w-5 h-5" />,
      step: '01',
      title: isAmharic ? 'ካርታ — ይመልከቱ' : 'Map — see the shape',
      desc: isAmharic
        ? 'አንድ ሙሉ ክፍል እንደ የተያያዙ ሀሳቦች። ከመጽሐፉ ሥር እስከ እያንዳንዱ ርዕስ ቁጥቋጦ ይጓዙ።'
        : 'A whole unit as connected ideas, from the book root down to each topic. Explore the structure instead of memorising the list.'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      step: '02',
      title: isAmharic ? 'አስተምሩ — ሩቲን' : 'Teach — explain to Rooty',
      desc: isAmharic
        ? 'ሀሳብን በቀላል ቃላት ለሩቲ ያስረዱ። በቀላሉ ማስተማር ካልቻሉ ገና አልተረዱትም።'
        : 'Explain a concept in plain words to Rooty. If you can teach it simply, you truly know it — and Rooty will catch what you don\u2019t.'
    },
    {
      icon: <FlaskConical className="w-5 h-5" />,
      step: '03',
      title: isAmharic ? 'ይለኩ — እድገትዎን' : 'Measure — watch recall grow',
      desc: isAmharic
        ? 'ከመማርዎ በፊት እና በኋላ ማስታወስዎን ይለኩ። ውጤት ብቻ ሳይሆን እውነተኛ እድገት ይመልከቱ።'
        : 'Measure your recall before and after. See the progress the grade never showed you.'
    }
  ];

  const closeTitle = isAmharic
    ? 'ከውጤት ባሻገር ማወቅ ጀምር።'
    : 'Start knowing, not just passing.';
  const closeBody = isAmharic
    ? 'ዘላቂ የሆነ መረዳት በመገንባት ጀምር።'
    : 'Start building an understanding that stays long after the exam.';

  return (
    <div
      ref={heroRef}
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)'
      }}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10">

        {/* ============ TOP BAR ============ */}
        <div className="flex items-center justify-between py-6">
          <AwdeLogo size="lg" isAmharic={isAmharic} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAestheticsModalOpen(true)}
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all"
              aria-label={isAmharic ? 'የዲዛይን ገጽታ ይምረጡ' : 'Choose design aesthetic'}
            >
              <Palette className="w-4 h-4" style={{ color: 'var(--app-accent, #4f46e5)' }} />
              {isAmharic ? 'ገጽታ' : 'Theme'}
            </button>
            <button
              onClick={onToggleLanguage}
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Languages className="w-4 h-4" style={{ color: 'var(--app-accent, #4f46e5)' }} />
              {language === 'am' ? 'Switch to English' : 'በአማርኛ ይመልከቱ'}
            </button>
          </div>
        </div>

        {/* ============ HERO ============ */}
        <motion.section
          style={{ opacity: heroOpacity }}
          className="relative min-h-[80vh] flex flex-col items-center justify-center text-center max-w-3xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className={`${display} text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.04]`}
          >
            {hero.titleA}
            <span className="block" style={{ color: 'var(--app-accent, #4f46e5)' }}>
              {hero.titleB}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18 }}
            style={{ color: 'var(--app-text-muted, #475569)' }}
            className="mt-8 text-lg sm:text-xl leading-relaxed max-w-xl"
          >
            {hero.sub}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.32 }}
            className="pt-10"
          >
            <button
              onClick={onEnterWorkspace}
              style={{
                backgroundColor: 'var(--app-accent, #4f46e5)',
                color: 'var(--app-accent-text, #ffffff)'
              }}
              className="group inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-bold text-sm sm:text-base shadow-lg hover:opacity-90 hover:scale-[1.03] transition-all"
            >
              {hero.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 1 }}
            style={{ color: 'var(--app-text-muted, #475569)' }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          >
            <span className="text-[11px] font-medium tracking-wide">{hero.scrollHint}</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
              <ArrowDown className="w-4 h-4" />
            </motion.div>
          </motion.span>
        </motion.section>

        {/* ============ THE STORY (manifesto) ============ */}
        <section className="py-24 sm:py-32">
          <Reveal className="max-w-2xl mx-auto text-center">
            <span className={sectionKicker} style={{ color: 'var(--app-accent, #4f46e5)' }}>
              {story.section}
            </span>
            <h2 className={`${display} mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight`}>
              {story.title}
              <span className="block" style={{ color: 'var(--app-accent, #4f46e5)' }}>
                {story.titleB}
              </span>
            </h2>
            <p
              className="mt-8 text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {story.body}
            </p>
            <p className={`${display} mt-8 text-lg sm:text-xl leading-relaxed italic`} style={{ color: 'var(--app-text, #020617)' }}>
              {story.pull}
            </p>
            <p
              className="mt-8 pt-6 border-t text-base sm:text-lg font-medium"
              style={{ color: 'var(--app-accent, #4f46e5)', borderColor: 'var(--app-border, #cbd5e1)' }}
            >
              {story.highlight}
            </p>
          </Reveal>
        </section>

        {/* ============ THE GAPS ============ */}
        <section className="py-12 sm:py-16">
          <Reveal className="max-w-2xl mx-auto text-center">
            <h2 className={`${display} text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight`}>
              {gapsTitle}
            </h2>
            <p
              className="mt-4 text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {gapsIntro}
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {gaps.map((gap, i) => (
              <motion.div
                key={gap.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="relative p-7 rounded-3xl border"
              >
                <span
                  className={`${display} text-3xl font-extrabold`}
                  style={{ color: 'var(--app-text-muted, #475569)' }}
                >
                  {gap.num}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug">{gap.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--app-text-muted, #475569)' }}
                >
                  {gap.desc}
                </p>
                <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--app-danger, #e11d48)' }}>
                  {gap.point}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ THE BRIDGE (Awde solution) ============ */}
        <section className="relative py-28 sm:py-36">
          <div
            className="absolute inset-x-0 top-1/2 bottom-0 -z-10"
            style={{
              background:
                'linear-gradient(180deg, transparent, var(--app-accent-bg, rgba(79,70,229,0.06)), transparent)'
            }}
          />
          <Reveal className="max-w-2xl mx-auto text-center">
            <span className={sectionKicker} style={{ color: 'var(--app-accent, #4f46e5)' }}>
              {bridge.section}
            </span>
            <h2 className={`${display} mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight`}>
              {bridge.title}
            </h2>
            <p
              className="mt-7 text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {bridge.body}
            </p>
          </Reveal>

          {/* The three movements */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5">
            {movements.map((m, i) => (
              <motion.div
                key={m.step}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="p-7 rounded-3xl border hover:-translate-y-1 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                      color: 'var(--app-accent, #4f46e5)'
                    }}
                  >
                    {m.icon}
                  </div>
                  <span
                    className={`${display} text-2xl font-extrabold`}
                    style={{ color: 'var(--app-text-muted, #475569)' }}
                  >
                    {m.step}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold leading-snug">{m.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: 'var(--app-text-muted, #475569)' }}
                >
                  {m.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ============ CLOSE ============ */}
        <section className="py-20 sm:py-24">
          <Reveal className="text-center max-w-xl mx-auto">
            <h2 className={`${display} text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight`}>
              {closeTitle}
            </h2>
            <p
              className="mt-5 text-base sm:text-lg leading-relaxed"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {closeBody}
            </p>
            <button
              onClick={onEnterWorkspace}
              style={{
                backgroundColor: 'var(--app-accent, #4f46e5)',
                color: 'var(--app-accent-text, #ffffff)'
              }}
              className="group mt-9 inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-bold text-sm sm:text-base shadow-lg hover:opacity-90 hover:scale-[1.03] transition-all"
            >
              {isAmharic ? 'ድልድዩን ይሻገሩ' : 'Cross the bridge'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Reveal>
        </section>

        {/* ============ FOOTER ============ */}
        <div
          className="pt-8 pb-12 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
        >
          <p className="text-xs" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic
              ? '© 2026 አውደ (Awde) — የተሰራው በኒው ኪብሩ'
              : '© 2026 Awde — Built by Lewi Kibru'}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <Wifi className="w-3.5 h-3.5" />
              {isAmharic ? 'ያለ ቁልፍ ይሰራል' : 'Works without an AI key'}
            </span>
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAmharic ? 'መረጃዎ በራስዎ መሳሪያ' : 'Your data stays on your device'}
            </span>
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <InfinityIcon className="w-3.5 h-3.5" />
              {isAmharic ? 'እንግሊዝኛ + አማርኛ' : 'English + Amharic'}
            </span>
          </div>
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
