import React from 'react';
import { Network, MessageSquare, FlaskConical, Compass, ArrowRight, Check } from 'lucide-react';
import { LanguageMode } from '../types';

interface OnboardingTourProps {
  isOpen: boolean;
  language: LanguageMode;
  onClose: () => void;
  onComplete: () => void;
}

interface StepDef {
  icon: React.ReactNode;
  title: string;
  titleAmharic: string;
  body: string;
  bodyAmharic: string;
}

/**
 * OnboardingTour — a short, first-run guide that walks a new user through
 * the four core parts of the workspace. It is intentionally a lightweight
 * intro modal rather than a DOM-hijacking spotlight so it stays robust and
 * never gets in the way.
 */
export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  language,
  onClose,
  onComplete
}) => {
  const isAmharic = language === 'am';
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const steps: StepDef[] = [
    {
      icon: <Compass className="w-6 h-6" />,
      title: 'Welcome to Awde',
      titleAmharic: 'እንኳን ወደ አውደ በደህና መጡ',
      body: 'Awde turns any textbook into a map you can walk through — so you understand it, not just memorise it.',
      bodyAmharic: 'አውደ ማንኛውንም መጽሐፍ ወደ መጓዝ የሚችሉበት ካርታ ይቀይረዋል — ለማስታወስ ሳይሆን ለመረዳት።'
    },
    {
      icon: <Network className="w-6 h-6" />,
      title: 'Mind-Maps that reward structure',
      titleAmharic: 'አወቃቀርን የሚያሳዩ የእይታ ካርታዎች',
      body: 'Open Mind-Map Studio to see a whole unit as connected ideas — explore from the book root down to each topic.',
      bodyAmharic: 'የእይታ ካርታ ስቱዲዮን ከፍተው አንድ ክፍል እንደ ተያያዙ ሀሳቦች ይመልከቱ — ከመጽሐፉ እስከ እያንዳንዱ ርዕስ።'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Teach Rooty',
      titleAmharic: 'ሩቲን አስተምሩ',
      body: 'In the Feynman Arena, explain a concept in plain words to Rooty. If you can teach it simply, you truly know it.',
      bodyAmharic: 'በፈይንድማን አሬና ሀሳብን በቀላል ቃላት ለሩቲ ያስረዱ። በቀላሉ ማስተማር ከቻሉ በእርግጥ ታውቀዋላችሁ።'
    },
    {
      icon: <FlaskConical className="w-6 h-6" />,
      title: 'Measure your recall',
      titleAmharic: 'የማስታወስ መጠንዎን ይለኩ',
      body: 'The Method Laboratory measures your recall before and after studying, so you can see real progress — not just a score.',
      bodyAmharic: 'የጥናት ላብራቶሪ ከመጠናቅዎ በፊት እና በኋላ ማስታወስዎን ይለካል — ውጤት ብቻ ሳይሆን እውነተኛ እድገት ያሳያል።'
    }
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const finish = () => {
    onComplete();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        style={{
          backgroundColor: 'var(--app-surface, #ffffff)',
          borderColor: 'var(--app-border, #cbd5e1)',
          color: 'var(--app-text, #020617)'
        }}
        className="relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
      >
        {/* Accent top strip */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: 'var(--app-accent, #4f46e5)' }}
        />

        <div className="p-7 sm:p-8">
          {/* Step icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.12))',
              color: 'var(--app-accent, #4f46e5)'
            }}
          >
            {current.icon}
          </div>

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight leading-tight">
            {isAmharic ? current.titleAmharic : current.title}
          </h2>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            {isAmharic ? current.bodyAmharic : current.body}
          </p>

          {/* Progress dots */}
          <div className="mt-7 flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 28 : 10,
                  backgroundColor:
                    i === step
                      ? 'var(--app-accent, #4f46e5)'
                      : 'var(--app-border, #cbd5e1)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div
          style={{
            borderTopColor: 'var(--app-border, #cbd5e1)'
          }}
          className="border-t px-7 sm:px-8 py-4 flex items-center justify-between"
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
                onClick={() => setStep((s) => Math.max(0, s - 1))}
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
                  backgroundColor: 'var(--app-accent, #4f46e5)',
                  color: 'var(--app-accent-text, #ffffff)'
                }}
              >
                {isAmharic ? 'ጀምር' : 'Start learning'}
                <Check className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: 'var(--app-accent, #4f46e5)',
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
