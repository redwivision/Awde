import React from 'react';
import { Compass, ArrowRight, Check } from 'lucide-react';
import { LanguageMode } from '../types';

interface OnboardingTourProps {
  isOpen: boolean;
  language: LanguageMode;
  onClose: () => void;
  onComplete: () => void;
}

interface Spot {
  selector?: string;
  box?: boolean;
  /** 'tabs' renders a plain-language list of what each menu item does (mobile). */
  kind?: 'tabs';
  title: string;
  titleAmharic: string;
  body: string;
  bodyAmharic: string;
  /** where the tooltip sits relative to the target */
  side?: 'below' | 'above';
}

/**
 * OnboardingTour — a short, first-run spotlight that points at the REAL
 * buttons on screen and uses words so simple a child could follow along.
 */
export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  language,
  onClose,
  onComplete
}) => {
  const isAmharic = language === 'am';
  const [step, setStep] = React.useState(0);
  const [spot, setSpot] = React.useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Mobile has no persistent sidebar (nav is in a slide-over drawer), so the
  // spotlight targets don't exist. We detect "narrow" and switch the tour to a
  // card-only flow that explains each tab instead of highlighting it.
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keep the current step in range when the steps list changes (e.g. rotate).
  React.useEffect(() => {
    setStep((s) => Math.min(s, steps.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const desktopSteps: Spot[] = [
    {
      title: 'Welcome',
      titleAmharic: 'እንኳን ደህና መጡ',
      body: 'This is a DEMO, not a finished product to use every day. It shows an idea — turn a textbook into a mind-map and teach it back to a robot. Data is saved only on this device. Enjoy exploring.',
      bodyAmharic: 'ይህ በየቀኑ የሚጠቀሙበት የተጠናቀቀ ምርት ሳይሆን ማሳያ (DEMO) ነው። የሚያሳየው ሀሳብ፡ የትምህርት መጽሐፍን ወደ ካርታ መቀየር እና ወደ ሮቦት ማስተማር ነው። መረጃዎ በዚህ መሣሪያ ላይ ብቻ ይቀመጣል። በመመርመር ደስ ይበልዎ።'
    },
    {
      selector: '[data-tour="books"]',
      side: 'below',
      title: 'Your books',
      titleAmharic: 'መጻሕፍትዎ',
      body: 'This shows all your books. Tap one to open it.',
      bodyAmharic: 'ይህ ሁሉንም መጻሕፍትዎን ያሳያል። ለመክፈት አንዱን ይንኩ።'
    },
    {
      selector: '[data-tour="map"]',
      side: 'below',
      title: 'See it as a map',
      titleAmharic: 'እንደ ካርታ ይመልከቱ',
      body: 'Every lesson becomes a map of ideas that connect. Open the map to explore it.',
      bodyAmharic: 'እያንዳንዱ ትምህርት የተያያዙ ሀሳቦች ካርታ ይሆናል። ለመመርመር ካርታውን ይክፈቱ።'
    },
    {
      selector: '[data-tour="teach"]',
      side: 'below',
      title: 'Teach Rooty',
      titleAmharic: 'ሩቲን አስተምሩ',
      body: 'Rooty is a friendly robot. Explain a thing to him in your own simple words. If you can explain it, you learned it.',
      bodyAmharic: 'ሩቲ ደግ ሮቦት ነው። ነገርን በራስዎ ቀላል ቃላት ያስረዱት። ማስረዳት ከቻሉ ተምረዋል ማለት ነው።'
    }
  ];

  const mobileSteps: Spot[] = [
    {
      title: 'Welcome',
      titleAmharic: 'እንኳን ደህና መጡ',
      body: 'This is a DEMO, not a finished product to use every day. It shows an idea — turn a textbook into a mind-map and teach it back to a robot. Data is saved only on this device. Enjoy exploring.',
      bodyAmharic: 'ይህ በየቀኑ የሚጠቀሙበት የተጠናቀቀ ምርት ሳይሆን ማሳያ (DEMO) ነው። የሚያሳየው ሀሳብ፡ የትምህርት መጽሐፍን ወደ ካርታ መቀየር እና ወደ ሮቦት ማስተማር ነው። መረጃዎ በዚህ መሣሪያ ላይ ብቻ ይቀመጣል። በመመርመር ደስ ይበልዎ።'
    },
    {
      kind: 'tabs',
      title: 'Tap ☰ to open the menu',
      titleAmharic: 'ምናሌውን ለመክፈት ☰ ይንኩ',
      body: 'On a phone, the menu hides behind the ☰ button up top. Here\u2019s what each one does:',
      bodyAmharic: 'በስልክ ላይ ምናሌው ከላይ ባለው ☰ አዝራር ጀርባ ይደበቃል። እያንዳንዱ ምን እንደሚሰራ እነሆ፡'
    }
  ];

  const steps = isMobile ? mobileSteps : desktopSteps;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const stepTo = (i: number) => {
    setStep(i);
    setSpot(null);
  };

  // Measure a target element and store its viewport box. The sidebar buttons
  // are always rendered on screen, so we measure directly rather than
  // scrolling — that avoids the page/sidebar chasing that caused blank steps.
  const measureSpot = (selector: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSpot({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  // Recompute highlight whenever the active step changes. Give the browser a
  // tick so the new step's layout has settled, then fall back to centering if
  // the target can't be found.
  React.useEffect(() => {
    if (!isOpen) return;
    if (!current.selector) {
      setSpot(null);
      return;
    }
    const id = window.setTimeout(() => {
      if (document.querySelector(current.selector as string)) {
        measureSpot(current.selector as string);
      } else {
        setSpot(null);
      }
    }, 60);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  // Keep the highlight glued to the target on scroll / resize of ANY ancestor.
  React.useEffect(() => {
    if (!isOpen || !current.selector) return;
    const update = () => {
      const el = document.querySelector<HTMLElement>(current.selector as string);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSpot({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    const raf = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (isOpen) stepTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const finish = () => {
    onComplete();
    onClose();
  };

  const tooltipAbove = current.side === 'above' || (spot && spot.top < 200);

  // Welcome step (no target): don't black out the whole screen — keep the
  // workspace clearly visible behind a soft glass card. Spotlight steps use a
  // full dim + glowing cutout instead.
  const isSpotlight = Boolean(spot);

  return (
    <div className="fixed inset-0 z-[80]" aria-modal="true" role="dialog">
      {/* Spotlight veil: a faint radial dim that keeps the dark workspace fully
          readable while slightly shading the edges — never blanks the screen. */}
      {isSpotlight && spot && (
        <div
          className="absolute inset-0"
          onClick={onClose}
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle 340px at ${spot.left + spot.width / 2}px ${
              spot.top + spot.height / 2
            }px, rgba(2,6,23,0.05) 0%, rgba(2,6,23,0.38) 74%, rgba(2,6,23,0.55) 100%)`
          }}
        />
      )}

      {/* Spotlight highlight around the target */}
      {spot && (
        <div
          className="absolute z-[81] pointer-events-none rounded-xl"
          style={{
            top: spot.top - 6,
            left: spot.left - 6,
            width: spot.width + 12,
            height: spot.height + 12,
            boxShadow: '0 0 0 4px var(--app-accent, #6366f1), 0 0 40px rgba(99,102,241,0.6)',
            border: '2px solid #ffffff'
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-[82] left-1/2 -translate-x-1/2 w-[min(90vw,26rem)] rounded-3xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: 'var(--app-surface, #ffffff)',
          borderColor: 'var(--app-border, #cbd5e1)',
          color: 'var(--app-text, #020617)',
          top: spot
            ? tooltipAbove
              ? Math.max(16, spot.top - 260)
              : spot.top + spot.height + 24
            : '50%'
        }}
      >
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: 'var(--app-accent, #6366f1)' }}
        />
        <div className="p-6 sm:p-7">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--app-accent-bg, rgba(99,102,241,0.12))',
              color: 'var(--app-accent, #6366f1)'
            }}
          >
            {current.selector ? <Compass className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
          </div>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight leading-tight">
            {isAmharic ? current.titleAmharic : current.title}
          </h2>
          <p
            className="mt-2.5 text-sm leading-relaxed"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            {isAmharic ? current.bodyAmharic : current.body}
          </p>

          {/* Mobile-only: plain-language menu legend (no sidebar to spotlight) */}
          {current.kind === 'tabs' && (
            <ul className="mt-4 space-y-2">
              {[
                { en: 'Books', am: 'መጻሕፍት', desc: 'All your books' },
                { en: 'Map', am: 'ካርታ', desc: 'Ideas as a map' },
                { en: 'Teach', am: 'አስተምር', desc: 'Explain to Rooty the robot' },
                { en: 'Quiz', am: 'ፈተና', desc: 'Test what you learned' },
                { en: 'Measure', am: 'ለካ', desc: 'Watch your memory grow' },
                { en: 'Focus', am: 'ትኩረት', desc: 'Study with a timer' }
              ].map((item) => (
                <li
                  key={item.en}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                    borderColor: 'var(--app-border, #cbd5e1)'
                  }}
                >
                  <span
                    className="w-16 shrink-0 text-xs font-bold"
                    style={{ color: 'var(--app-accent, #6366f1)' }}
                  >
                    {isAmharic ? item.am : item.en}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: 'var(--app-text-muted, #475569)' }}
                  >
                    {isAmharic
                      ? {
                          Books: 'ሁሉም መጻሕፍትዎ',
                          Map: 'ሀሳቦች እንደ ካርታ',
                          Teach: 'ለሩቲ ሮቦት ያስረዱ',
                          Quiz: 'የተማሩትን ይፈትኑ',
                          Measure: 'የማስታወስ እድገትዎን ይመልከቱ',
                          Focus: 'በጊዜ ቆጣሪ ያጥኑ'
                        }[item.en]
                      : item.desc}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Progress dots */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => stepTo(i)}
                aria-label={`Step ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 26 : 10,
                  backgroundColor:
                    i === step
                      ? 'var(--app-accent, #6366f1)'
                      : 'var(--app-border, #cbd5e1)'
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{ borderTopColor: 'var(--app-border, #cbd5e1)' }}
          className="border-t px-6 sm:px-7 py-4 flex items-center justify-between"
        >
          <button
            onClick={onClose}
            className="text-xs font-semibold"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            {isAmharic ? 'ዝለል' : 'Skip'}
          </button>
          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                onClick={() => stepTo(Math.max(0, step - 1))}
                className="px-4 py-2 rounded-xl text-xs font-bold border"
                style={{
                  backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text, #020617)'
                }}
              >
                {isAmharic ? 'ተመለስ' : 'Back'}
              </button>
            )}
            {isLast ? (
              <button
                onClick={finish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: 'var(--app-accent, #6366f1)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
              >
                {isAmharic ? 'ጀምር' : 'Let\u2019s go'}
                <Check className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => stepTo(Math.min(steps.length - 1, step + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: 'var(--app-accent, #6366f1)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
              >
                {isAmharic ? 'ቀጣይ' : 'Next'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
