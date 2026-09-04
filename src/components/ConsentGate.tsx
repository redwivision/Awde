import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Check, BookOpen } from 'lucide-react';
import { LanguageMode } from '../types';
import { PrivacyModal } from './PrivacyModal';

// One-time age-gate + informed-consent screen. Shown before the workspace is
// usable. Awde stores no personal data by default; this gate makes the audience
// (students, many minors) explicit and records their consent locally only.
export interface ConsentRecord {
  age: '13plus' | 'guardian';
  at: string;
}

const CONSENT_KEY = 'awde_consent_v1';

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    return parsed && parsed.age ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(record: ConsentRecord): void {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  } catch {
    /* best-effort */
  }
}

interface ConsentGateProps {
  onAgree: (record: ConsentRecord) => void;
  language: LanguageMode;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({ onAgree, language }) => {
  const isAmharic = language === 'am';
  const [age, setAge] = useState<'13plus' | 'guardian'>('13plus');
  const [agreed, setAgreed] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--app-surface, #ffffff)',
          border: '1px solid var(--app-border, #cbd5e1)',
          color: 'var(--app-text, #020617)'
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--app-accent-bg, rgba(99,102,241,0.12))',
                color: 'var(--app-accent, #6366f1)'
              }}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight font-display antialiased">
                {isAmharic ? 'የግላዊነት እና የእድሜ ማረጋገጫ' : 'Guardians & privacy'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted, #475569)' }}>
                {isAmharic ? 'መግባት በመጀመርዎ ያረጋግጣሉ' : 'One quick check before you start'}
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed">
            {isAmharic
              ? 'አውደ (Awde) የጥናት መተግበሪያ ነው። በመደበኛነት ምንም መረጃ አንሰበስብም — ትምህርትዎ በራስዎ መሳሪያ ላይ ይኖራል። መለያ ከፈጠሩ፣ ኢሜይልዎን ብቻ ነው የሚጠየቀው።'
              : 'Awde is a study app for students. By default we collect nothing — your learning stays on your own device. If you create an account, we only ask for your email to sync your books across devices.'}
          </p>

          <div className="mt-5 space-y-2.5">
            <p className="text-xs font-semibold" style={{ color: 'var(--app-text-muted, #475569)' }}>
              {isAmharic ? 'እድሜዎን ያረጋግጡ' : 'Confirm your age'}
            </p>
            {(
              [
                { value: '13plus', label: isAmharic ? 'እኔ 13 ወይም ከዚያ በላይ ነኝ' : "I am 13 or older" },
                { value: 'guardian', label: isAmharic ? 'ወላጅ/አሳዳጊዬ ይህንን አጽድቆኛል' : "My parent or guardian has approved my use" }
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm font-medium border transition-colors"
                style={{
                  borderColor: age === opt.value ? 'var(--app-accent, #6366f1)' : 'var(--app-border, #cbd5e1)',
                  backgroundColor: age === opt.value ? 'var(--app-accent-bg, rgba(99,102,241,0.08))' : 'var(--app-surface-elevated, #f8fafc)'
                }}
              >
                <input
                  type="radio"
                  name="age"
                  checked={age === opt.value}
                  onChange={() => setAge(opt.value)}
                  className="accent-[var(--app-accent,#6366f1)]"
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <label className="flex items-start gap-3 text-xs leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[var(--app-accent,#6366f1)]"
              />
              <span>
                {isAmharic
                  ? 'በአውደ ግላዊነት መርሆዎች እና ደንቦች ላይ ተስማምቻለሁ — ተጨማሪ የመማር ዳታ (quiz፣ ውጤት፣ Feynman) ልምዱን ለማስተካከል ሊጠቀም ይችላል።'
                  : 'I agree to Awde’s Privacy & Terms — including the use of my learning data (quizzes, scores, Feynman) to adapt the app to how I learn.'}
              </span>
            </label>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 transition-opacity"
              style={{ color: 'var(--app-accent, #6366f1)' }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {isAmharic ? 'ሙሉ ፖሊሲ ያንብቡ' : 'Read the full Privacy & Terms'}
            </button>
          </div>

          <button
            onClick={() => agreed && onAgree({ age, at: new Date().toISOString() })}
            disabled={!agreed}
            className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-45"
            style={{ backgroundColor: 'var(--app-accent, #6366f1)', color: 'var(--app-accent-text, #ffffff)' }}
          >
            <Check className="w-4 h-4" />
            {isAmharic ? 'ጀምር' : 'Start learning'}
          </button>

          <p className="mt-4 text-[11px] leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic
              ? 'ከኢሜይል ውጪ ምንም የአካል መረጃ አንሰበስብም፤ የመማር ዳታ ልምዱን ለማስተካከል ነው። በፈለጉት ጊዜ Account → Delete ሁሉንም ይሰርዛል።'
              : 'We collect no personal data beyond a login email; learning data is used only to adapt the experience. You can erase everything anytime under Account → Delete.'}
          </p>
        </div>
      </motion.div>
    </div>

    <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} language={language} />
    </>
  );
};