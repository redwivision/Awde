import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Network, MessageSquare, FlaskConical, ArrowRight } from 'lucide-react';
import { LanguageMode } from '../types';

interface AboutPageProps {
  language: LanguageMode;
}

const display = 'font-display antialiased';
const sectionKicker = 'text-[11px] font-semibold uppercase tracking-[0.28em]';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className
}) => (
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

export const AboutPage: React.FC<AboutPageProps> = ({ language }) => {
  const isAmharic = language === 'am';

  const hero = {
    kicker: isAmharic ? 'ስለ አውደ' : 'About Awde',
    title: isAmharic ? 'አውደ ማለት' : 'What Awde means',
    titleB: isAmharic ? '“ዘር” — ትልቅ ነገር የሚጀመርበት።' : '“seed” — where big things begin.',
    body: isAmharic
      ? 'አውደ በአማርኛ “ዘር” ማለት ነው። እንደ ትንሽ ዘር ጀምሮ ወደ ተያያዘ እውቀት እንዲያድግ አንድ ሃሳብ ተመስርቷል። ተማሪዎች ለፈተና ብቻ ሳይሆን ከፈተና በኋላ የሚቆይ ነገር እንዲገነቡ ነው የተሰራው።'
      : 'Awde is Amharic for “seed”. It is built on the idea that a single concept begins small and grows into connected knowledge. Awde exists so students build something that survives the exam — not just a score that fades.',
    cta: isAmharic ? 'እወቅ አሳድግ' : 'Know it. Grow it.'
  };

  const mission = {
    kicker: isAmharic ? 'ተልዕኮ' : 'The mission',
    title: isAmharic ? 'ውጤትን ወደ መረዳት መለወጥ።' : 'Turn grades into understanding.',
    body: isAmharic
      ? 'አብዛኛው ጊዜ የምናጠናው ፈተናውን ለማለፍ ነው — እውቀቱን ለመቆጣጠር አይደለም። መለካት የሚቻለው ነገር ስኬት ነው ቢሆን፣ የሚቆየው ግን ግንዛቤ ነው። አውደ ትኩረቱን ከውጤት ወደ እውነተኛ እውቀት ይመልሳል።'
      : 'Most of us study to pass, not to keep what we learn. A score is the part we measure; understanding is the part that lasts. Awde shifts the centre of gravity from the grade to the knowledge behind it.'
  };

  const gaps = [
    {
      num: '01',
      title: isAmharic ? 'በውጤት ይለካል፣ በመረዳት አይደለም' : 'Measured on scores, not understanding',
      desc: isAmharic
        ? 'ለማለፍ የሚገመገመውን ማወቅ በቂ ነው — ስለዚህ ተማሪዎች ከእውቀት ይልቅ ለፈተናው ያሻሽላሉ።'
        : 'It is enough to reproduce what is graded, so students optimise for the test rather than for knowing.'
    },
    {
      num: '02',
      title: isAmharic ? 'አንድ መንገድ ለሁሉም' : 'One method for every mind',
      desc: isAmharic
        ? 'እያንዳንዱ አእምሮ የተለየ በሆነ መንገድ ይማራል — ነገር ግን ትምህርት ለሁሉም በአንድ መንገድ ይደርሳል።'
        : 'Every mind learns differently, yet the lesson is delivered one way to a room of many minds.'
    },
    {
      num: '03',
      title: isAmharic ? 'እውቀቱን የመጠቀም እድል የለም' : 'No chance to use the knowledge',
      desc: isAmharic
        ? 'ማስታወስ አለ፣ ግን የተማረውን ለማስተማር፣ ለማብራራት ወይም ለመጠቀም እድል የለውም።'
        : 'There is cramming, but almost never an invitation to actually teach, explain, or use what was learned.'
    }
  ];

  const movements = [
    {
      icon: <Network className="w-5 h-5" />,
      step: '01',
      title: isAmharic ? 'ካርታ' : 'Map',
      desc: isAmharic
        ? 'አንድ ሙሉ ክፍል እንደ የተያያዙ ሃሳቦች ይመልከቱ።'
        : 'See a whole unit as connected ideas, not a list to memorise.'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      step: '02',
      title: isAmharic ? 'አስተምር' : 'Teach',
      desc: isAmharic
        ? 'ሃሳብን ለሩቲ በቀላል ቃላት ያስረዱ። በቀላሉ ማስተማር ካልቻሉ ገና አልተረዱትም።'
        : 'Explain a concept in plain words to Rooty. If you can’t teach it simply, you don’t know it yet.'
    },
    {
      icon: <FlaskConical className="w-5 h-5" />,
      step: '03',
      title: isAmharic ? 'ለካ' : 'Measure',
      desc: isAmharic
        ? 'ከመማርዎ በፊት እና በኋላ ማስታወስዎን ይለኩ።'
        : 'Measure your recall before and after — see the progress a grade never shows.'
    }
  ];

  const built = {
    kicker: isAmharic ? 'ለትንንሽ ማደግ አእምሮዎች' : 'Built for growing minds',
    title: isAmharic ? 'የተገነባው በጥቂት አደንዛዥ ነገሮች' : 'Made for low-bandwidth, offline-first learning',
    body: isAmharic
      ? 'አውደ በደካማ ዊፋይ እና አነስተኛ ኃይል ላላቸው መሣሪያዎች የተነደፈ ነው። ከAI ቁልፍ ውጭ ይሰራል፣ መረጃዎ በመሣሪያዎ ላይ ይኖራል፣ እና መለያ ሲገቡ በመሣሪያዎች ይመሳሰላል — ሁሉም ነገር በኢትዮጵያ ውስጥ የተሰራ ነው።'
      : 'Awde is designed for weak wifi and modest devices. It works without an AI key, keeps your data on your device, syncs across devices when you sign in — and is built in Ethiopia, for Ethiopia.'
  };

  return (
    <div>
      <section className="py-16 sm:py-20 text-center max-w-2xl mx-auto">
        <span className={sectionKicker} style={{ color: 'var(--app-accent, #4f46e5)' }}>
          {hero.kicker}
        </span>
        <h1 className={`${display} mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight`}>
          {hero.title}
          <span className="block" style={{ color: 'var(--app-accent, #4f46e5)' }}>
            {hero.titleB}
          </span>
        </h1>
        <p className="mt-7 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
          {hero.body}
        </p>
      </section>

      <section className="py-8 sm:py-12 text-center max-w-2xl mx-auto">
        <Reveal>
          <span className={sectionKicker} style={{ color: 'var(--app-accent, #4f46e5)' }}>
            {mission.kicker}
          </span>
          <h2 className={`${display} mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight`}>
            {mission.title}
          </h2>
          <p className="mt-5 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {mission.body}
          </p>
        </Reveal>
      </section>

      <section className="py-12 sm:py-16">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className={`${display} text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight`}>
            {isAmharic ? 'ለምን ነበር የጀመረው' : 'Why it exists'}
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic
              ? 'ችግሩ ተማሪው ወይም እውቀቱ አይደለም — ችግሩ በስርዓቱ ውስጥ ነው።'
              : "The problem isn't the student, and it isn't the knowledge. The gaps live in the system."}
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {gaps.map((gap, i) => (
            <Reveal key={gap.num} delay={i * 0.1}>
              <div
                className="h-full p-7 rounded-3xl border"
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
              >
                <span className={`${display} text-3xl font-extrabold`} style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {gap.num}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug">{gap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {gap.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <span className={sectionKicker} style={{ color: 'var(--app-accent, #4f46e5)' }}>
            {isAmharic ? 'እንዴት ይሰራል' : 'How it works'}
          </span>
          <h2 className={`${display} mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight`}>
            {isAmharic ? 'ሦስት እንቅስቃሴዎች' : 'Three movements'}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {movements.map((m, i) => (
            <Reveal key={m.step} delay={i * 0.1}>
              <div
                className="h-full p-7 rounded-3xl border hover:-translate-y-1 hover:shadow-lg transition-all"
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
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
                  <span className={`${display} text-2xl font-extrabold`} style={{ color: 'var(--app-text-muted, #475569)' }}>
                    {m.step}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold leading-snug">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {m.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative py-20 sm:py-24">
        <div
          className="absolute inset-x-0 top-1/2 bottom-0 -z-10"
          style={{
            background:
              'linear-gradient(180deg, transparent, var(--app-accent-bg, rgba(79,70,229,0.06)), transparent)'
          }}
        />
        <Reveal className="max-w-2xl mx-auto text-center">
          <span className={sectionKicker} style={{ color: 'var(--app-accent, #4f46e5)' }}>
            {built.kicker}
          </span>
          <h2 className={`${display} mt-4 text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight`}>
            {built.title}
          </h2>
          <p className="mt-6 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {built.body}
          </p>
          <Link
            to="/workspace"
            className="group mt-10 inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-bold text-sm sm:text-base shadow-lg hover:opacity-90 hover:scale-[1.03] transition-all"
            style={{
              backgroundColor: 'var(--app-accent, #4f46e5)',
              color: 'var(--app-accent-text, #ffffff)'
            }}
          >
            {isAmharic ? 'ጀምር — ድልድዩን ይሻገሩ' : 'Start — cross the bridge'}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
};