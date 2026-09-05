import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { LanguageMode } from '../types';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageMode;
}

// The full Privacy & Terms statement, rendered inside the app so users can read
// it from the consent gate and the footer. The repo copy (docs/PRIVACY.md) is
// the source of truth; this modal is the public-facing version of the same
// content (EN + AM). Keep both in sync.
export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, language }) => {
  const isAmharic = language === 'am';
  if (!isOpen) return null;

  const sections = [
    {
      title: isAmharic ? 'ምን ይሰበሰባል' : 'What we collect',
      body: isAmharic
        ? 'በመደበኛነት ምንም ነገር ሰርቨር ላይ አንልክም — መጻሕፍትዎ፣ ውጤቶችዎ፣ እና ትምህርትዎ በራስዎ መሳሪያ ላይ ይቆያሉ። መለያ ሲፈጥሩ ኢሜይልዎን ብቻ እንጠይቃለን። ስም፣ አድራሻ፣ ስልክ፣ ፎቶ በፍጹም አንሰበስብም።'
        : 'By default, nothing leaves your device — your books, scores, and study activity live in your browser. If you create an account we store your email (to log you in). We never collect your name, address, phone, or photos.',
    },
    {
      title: isAmharic ? 'የመማር ዳታ እና ማስተካከያ (personalization)' : 'Learning data & personalization',
      body: isAmharic
        ? 'መለያ ሲኖርዎ፣ የጥናት እንቅስቃሴዎን (ፈተና፣ የበላይነት ውጤት፣ Feynman) እንሰበስባለን ልምዱን ለማስተካከል — ወደእርስዎ የመማር ዘይቤ እንዲስማማ። ይህ የትምህርት ውሂብ ነው፣ የአካል መረጃ አይደለም።'
        : 'With an account, we may use your learning activity (quiz results, mastery scores, Feynman sessions, time studied) to adapt Awde to how you learn best — your "sweet learning spot." This is learning data, not personal identity. We do not sell or share it with advertisers.',
    },
    {
      title: isAmharic ? 'ለአካለ መጠን ያልደረሱ ተማሪዎች' : 'Students & guardians',
      body: isAmharic
        ? 'አውደ ለ13+ ወይም የወላጅ ፈቃድ ላላቸው ተማሪዎች ነው። ከመጀመርዎ በፊት ይህንን የሚጠይቅ መግቢያ አለ። መለያ ከሌለ ምንም ወደ ሰርቨር አይሄድም።'
        : "Awde is for students 13+, or any age with a parent or guardian's permission. The in-app gate asks for this before use. Without an account, nothing is sent to any server.",
    },
    {
      title: isAmharic ? 'መግቢያ እና ሴሽን' : 'Logins & sessions',
      body: isAmharic
        ? 'የይለፍ ቃል የለም — በኢሜይል አንድ-ጊዜ ማገናኛ ይደርስዎታል። ማገናኛዎች በ15 ደቂቃ ያበቃሉ፤ ሴሽን 30 ቀን ይቆያል።'
        : "Logging in is passwordless — we email you a one-time link. Links expire after 15 minutes; sessions last 30 days.",
    },
    {
      title: isAmharic ? 'AI እና ደህንነት' : 'AI & safety',
      body: isAmharic
        ? 'ጥያቄዎችዎ ለመልስ AI ፕሮቫይደር ይደርሳሉ። አውደ ሁለት መከላከያ አለው፦ (1) የሚያስገባው ይዘት ለደህንነት ይጣራል፤ (2) AI ንፁህ ትምህርትን ብቻ እንዲሰጥ ጥብቅ መመሪያ ይይዛል።'
        : "Questions you type are sent to an AI provider to get answers. Awde runs both an input content-safety filter and a strict safety instruction on the model — but no filter is perfect, so we recommend using it with a young learner.",
    },
    {
      title: isAmharic ? 'መረጃዎን መቆጣጠር' : 'Your controls',
      body: isAmharic
        ? 'የአካባቢ ዳታ፦ የብራውዘር ውሂብ ማጽዳት ሁሉንም ያስወግዳል። የመለያ ዳታ፦ በመተግበሪያው Account → Delete የመለያዎን እና ሁሉንም የሰርቨር ውሂብዎን በቋሚነት ይሰርዛል።'
        : 'Local data: clearing your browser storage removes everything. Account data: in the app, Account → Delete permanently erases your profile, synced books, and history from the server.',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden z-10"
          style={{
            backgroundColor: 'var(--app-surface, #ffffff)',
            border: '1px solid var(--app-border, #cbd5e1)',
            color: 'var(--app-text, #020617)'
          }}
        >
          <div
            className="p-6 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--app-accent-bg, rgba(99,102,241,0.12))',
                  color: 'var(--app-accent, #6366f1)'
                }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight font-display antialiased">
                  {isAmharic ? 'ግላዊነት እና ደንቦች (Privacy & Terms)' : 'Privacy & Terms'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic ? 'ለመጠቀም ከመጀመርዎ በፊት ያንብቡ' : 'Last updated September 2026'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text-muted, #475569)' }}
              aria-label="Close privacy policy"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5">
            {sections.map((s, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {s.body}
                </p>
              </div>
            ))}
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
              {isAmharic ? (
                <>
                  ጥያቄዎች ወይም የመሰረዝ ጥያቄ ካለ፣ በ ‹‹ያግኙን›› ቅጽ ወይም በኢሜይል ያነጋግሩ፡{' '}
                  <span className="font-semibold text-foreground break-all" style={{ color: 'var(--app-accent, #6366f1)' }}>
                    lewikb13@gmail.com
                  </span>{' '}
                  በ30 ቀናት ውስጥ እንመልሳለን።
                </>
              ) : (
                <>
                  Questions or deletion requests — use the in-app “Contact us” form, or email{' '}
                  <span className="font-semibold text-foreground break-all" style={{ color: 'var(--app-accent, #6366f1)' }}>
                    lewikb13@gmail.com
                  </span>{' '}
                  and we respond within 30 days.
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};