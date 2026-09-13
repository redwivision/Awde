import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Mail, CheckCircle2, BookOpen, AtSign, ShieldCheck } from 'lucide-react';
import { LanguageMode } from '../types';
import { getSession, googleAuthAvailable } from '../lib/sync';
import { googleSignIn } from '../lib/betterAuthClient';
import { PrivacyModal } from './PrivacyModal';
import { ContactModal } from './ContactModal';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageMode;
  onSignedIn?: () => void;
}

const CONNECT_PHASES = ['Connecting to Google', 'Verifying account', 'Opening sign-in'];
const CONNECT_PHASES_AM = ['ከ Google ጋር ይገናኛል', 'መለያ ይፈትሻል', 'መግቢያ ይከፈታል'];

const GoogleConnectingLoading: React.FC<{ isAmharic: boolean }> = ({ isAmharic }) => {
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      phaseRef.current = (phaseRef.current + 1) % CONNECT_PHASES.length;
      setPhase(phaseRef.current);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="w-full flex items-center gap-3">
      <span className="relative w-6 h-6 shrink-0" aria-hidden>
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid transparent', borderTopColor: '#4285F4', borderRightColor: '#EA4335', borderBottomColor: '#FBBC05', borderLeftColor: '#34A853' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        />
        <span className="absolute inset-[5px]">
          <GoogleG />
        </span>
      </span>
      <motion.span
        key={phase}
        className="text-sm font-bold"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {isAmharic ? CONNECT_PHASES_AM[phase] : CONNECT_PHASES[phase]}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          …
        </motion.span>
      </motion.span>
    </span>
  );
};

const GoogleG: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </svg>
);

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, language, onSignedIn }) => {
  const isAmharic = language === 'am';
  const session = getSession();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [googleReady, setGoogleReady] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleCheckRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setGoogleReady('checking');
    const check = googleAuthAvailable();
    googleCheckRef.current = check;
    check.then((ok) => {
      if (!cancelled) setGoogleReady(ok ? 'ready' : 'unavailable');
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // If the availability probe is still in flight (or never finished on a
      // slow network), let the click await it — the button stays visible and
      // shows the connecting state instead of hiding behind a spinner.
      if (googleReady === 'checking' && googleCheckRef.current) {
        const ok = await googleCheckRef.current;
        setGoogleReady(ok ? 'ready' : 'unavailable');
        if (!ok) throw new Error('unavailable');
      }
      if (googleReady === 'unavailable') throw new Error('unavailable');
      await googleSignIn(window.location.pathname + window.location.search);
    } catch {
      setGoogleLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10"
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
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight font-display antialiased">
                  {isAmharic ? 'መለያ' : 'Account'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic ? 'በማንኛውም መሣሪያ ምዝገባዎ ይቆይ' : 'Keep your progress on any device'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text-muted, #475569)' }}
              aria-label="Close account settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {session ? (
              <div className="space-y-4">
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                    border: '1px solid var(--app-border, #cbd5e1)'
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold"
                    style={{ backgroundColor: 'var(--app-accent, #6366f1)', color: '#ffffff' }}
                  >
                    {(session.user?.email || session.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{session.user?.email || session.email}</div>
                    <div className="text-xs" style={{ color: 'var(--app-text-muted, #475569)' }}>
                      {isAmharic ? 'ተመዝግበዋል' : 'Signed in'} · {isAmharic ? 'ምዝገባ እየተመሳሰለ ነው' : 'Progress syncs as you study'}
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 ml-auto shrink-0" style={{ color: 'var(--app-accent, #6366f1)' }} />
                </div>

                <button
                  onClick={() => {
                    import('../lib/sync').then((m) => m.logout());
                    onSignedIn?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors"
                  style={{
                    borderColor: 'var(--app-border, #cbd5e1)',
                    color: 'var(--app-text, #020617)'
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {isAmharic ? 'ውጣ' : 'Sign out'}
                </button>

                <div className="pt-1 border-t" style={{ borderColor: 'var(--app-border, #cbd5e1)' }}>
                  {!confirmingDelete ? (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="w-full text-xs font-medium py-1.5 transition-colors"
                      style={{ color: 'var(--app-danger, #e11d48)' }}
                    >
                      {isAmharic ? 'መለያዬን እና መረጃዬን ደብዝዝ (delete my data)' : 'Delete my account and data'}
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                        {isAmharic
                          ? 'ይህ ሁሉንም የሚሰረዝ ነው፡ መለያዎ፣ መፃህፍቶችዎ፣ እና የጥናት ታሪክዎ በሰርቨር ላይ። እርግጠኛ ነዎት?'
                          : 'This permanently erases your account, books, and study history on the server. This cannot be undone.'}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            setDeleteError('');
                            const result = await import('../lib/sync').then((m) => m.deleteAccount());
                            if (result.ok) {
                              setConfirmingDelete(false);
                              onSignedIn?.();
                            } else {
                              setDeleteError(
                                result.error ||
                                  (isAmharic ? 'መሰረዝ ተሳክቶ አይደለም።' : 'Could not delete your account.')
                              );
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-opacity"
                          style={{ backgroundColor: 'var(--app-danger, #e11d48)', color: '#ffffff' }}
                        >
                          {isAmharic ? 'አዎ፣ ደብዝዝ' : 'Yes, delete'}
                        </button>
                        <button
                          onClick={() => {
                            setConfirmingDelete(false);
                            setDeleteError('');
                          }}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors"
                          style={{ borderColor: 'var(--app-border, #cbd5e1)', color: 'var(--app-text, #020617)' }}
                        >
                          {isAmharic ? 'ተመለስ' : 'Cancel'}
                        </button>
                      </div>
                      {deleteError && (
                        <p className="text-xs" style={{ color: '#dc2626' }}>
                          {deleteError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors overflow-hidden relative disabled:cursor-wait"
                  style={{
                    borderColor: googleLoading ? 'var(--app-accent, #6366f1)' : 'var(--app-border, #cbd5e1)',
                    color: 'var(--app-text, #020617)',
                    backgroundColor: 'var(--app-surface-elevated, #f8fafc)'
                  }}
                >
                  {googleLoading ? (
                    <GoogleConnectingLoading isAmharic={isAmharic} />
                  ) : (
                    <>
                      <GoogleG />
                      {isAmharic ? 'በ Google ይግቡ' : 'Continue with Google'}
                    </>
                  )}
                </button>

                {googleReady === 'unavailable' && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                    {isAmharic
                      ? 'በGoogle መግባት በዚህ ሰርቨር ላይ ገና አልተዋቀረም። ያለ መለያም መጠቀም ይችላሉ።'
                      : 'Google sign-in isn\u2019t configured on this server yet. You can still use the app without an account.'}
                  </p>
                )}

                <div className="flex items-start gap-2.5 pt-1">
                  <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--app-accent, #6366f1)' }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                    {isAmharic
                      ? 'መለያ ለእርስዎ የወደፊት ትምህርት ምዝገባ እድገት ይቆጥባል። የGoogle መግቢያ ስምዎን እና ኢሜይልዎን ብቻ ያጋራል — ሌላ ምንም አይደለም።'
                      : 'An account saves your progress for your future. Google login shares your Google name and email — nothing else.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className="mt-6 pt-4 border-t grid grid-cols-2 gap-2"
            style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
          >
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {isAmharic ? 'ግላዊነት እና ደንቦች' : 'Privacy & Terms'}
            </button>
            <button
              onClick={() => setIsContactOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <AtSign className="w-3.5 h-3.5" />
              {isAmharic ? 'አግኙን' : 'Contact us'}
            </button>
          </div>
        </motion.div>
      </div>
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} language={language} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} language={language} />
    </AnimatePresence>
  );
};