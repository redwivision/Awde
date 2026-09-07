import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, Mail, CheckCircle2, Loader2, BookOpen, AtSign } from 'lucide-react';
import { LanguageMode } from '../types';
import { getSession, requestLogin, googleAuthAvailable } from '../lib/sync';
import { googleSignIn } from '../lib/betterAuthClient';
import { PrivacyModal } from './PrivacyModal';
import { ContactModal } from './ContactModal';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageMode;
  onSignedIn?: () => void;
}

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

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [devLink, setDevLink] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setGoogleReady(false);
    googleAuthAvailable().then((ok) => {
      if (!cancelled) setGoogleReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error');
      setMessage(isAmharic ? 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ።' : 'Please enter a valid email address.');
      return;
    }
    setStatus('loading');
    setMessage('');
    const res = await requestLogin(trimmed);
    if (res.ok && res.data?.success) {
      setStatus('sent');
      const data = res.data as any;
      setMessage(
        data.emailSent
          ? isAmharic
            ? 'የመግቢያ ማገናኛ ወደ ኢሜይልዎ ተልኳል። የብልግል (spam) ሳጥንዎንም ያጣሩ።'
            : 'A login link was emailed to you. Check your inbox (and spam folder).'
          : isAmharic
          ? 'የመግቢያ ማገናኛ ተዘጋጅቷል። ከታች ያለውን Dev ማገናኛ ይክፈቱ።'
          : 'Login link ready. Open the Dev link below to finish.'
      );
      setDevLink(data.devLink || null);
    } else if (res.data?.localMode) {
      setStatus('sent');
      setMessage(
        isAmharic
          ? 'ይህ ሰርቨር መለያ አልያዘም — ወደ አካባቢያዊ (local) ሁነታ ይቀጥላል።'
          : 'This server has no accounts configured — staying in local mode.'
      );
    } else {
      setStatus('error');
      setMessage(res.data?.error || (isAmharic ? 'የተሳሳተ ነገር ተከስቷል።' : 'Something went wrong. Please try again.'));
    }
  };

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
                {googleReady && (
                  <>
                    <button
                      onClick={async () => {
                        setGoogleLoading(true);
                        try {
                          await googleSignIn(window.location.pathname + window.location.search);
                        } catch {
                          setGoogleLoading(false);
                          setStatus('error');
                          setMessage(
                            isAmharic
                              ? 'በ Google መግባት አልተሳካም። እባክዎ በኋላ ይሞክሩ።'
                              : 'Google sign-in failed. Please try again.'
                          );
                        }
                      }}
                      disabled={googleLoading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-opacity disabled:opacity-60"
                      style={{
                        borderColor: 'var(--app-border, #cbd5e1)',
                        color: 'var(--app-text, #020617)',
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)'
                      }}
                    >
                      {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleG />}
                      {isAmharic ? 'በ Google ይግቡ' : 'Continue with Google'}
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--app-border, #cbd5e1)' }} />
                      <span className="text-[11px] font-medium" style={{ color: 'var(--app-text-muted, #475569)' }}>
                        {isAmharic ? 'ወይም' : 'or'}
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--app-border, #cbd5e1)' }} />
                    </div>
                  </>
                )}
                <label className="block text-xs font-semibold" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic ? 'ኢሜይል' : 'Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus('idle');
                    setMessage('');
                  }}
                  placeholder={isAmharic ? 'you@example.com' : 'you@example.com'}
                  disabled={status === 'loading'}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 border"
                  style={{
                    backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                    borderColor: 'var(--app-border, #cbd5e1)',
                    color: 'var(--app-text, #020617)'
                  }}
                />

                <button
                  onClick={submit}
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: 'var(--app-accent, #6366f1)', color: '#ffffff' }}
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isAmharic ? 'የመግቢያ አገናኝ ይላክ' : 'Email me a login link'}
                </button>

                {message && (
                  <p
                    className="text-xs leading-relaxed flex items-start gap-2"
                    style={{ color: status === 'error' ? '#dc2626' : 'var(--app-text-muted, #475569)' }}
                  >
                    <span className="mt-0.5 shrink-0">
                      {status === 'error' ? (
                        <LogIn className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </span>
                    {message}
                  </p>
                )}

                {devLink && status === 'sent' && !message.includes('local mode') && (
                  <div
                    className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg break-all"
                    style={{
                      backgroundColor: 'var(--app-accent-bg, rgba(99,102,241,0.12))',
                      color: 'var(--app-accent, #6366f1)'
                    }}
                  >
                    <span className="shrink-0 font-bold">
                      {isAmharic ? 'ገንቢ ማገናኛ፡ ' : 'Dev link: '}
                    </span>
                    <a href={devLink} className="underline underline-offset-2">
                      {devLink}
                    </a>
                  </div>
                )}

                {devLink && status === 'sent' && !message.includes('local mode') && (
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                    {isAmharic
                      ? 'ይህ የገንቢ (dev) ሰርቨር ነው — ኢሜይል አይልክም። ማገናኛውን ከፍተው ወደዚህ ትር ይመለሱ።'
                      : 'Dev mode: this server does not send email, so the link appears here instead of your inbox. Open it in a new tab, then come back here.'}
                  </p>
                )}

                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic
                    ? 'መለያ ለእርስዎ የወደፊት ትምህርት ምዝገባ እድገት ይቆጥባል። የGoogle መግቢያ ስምዎን እና ኢሜይልዎን ብቻ ያጋራል — ሌላ ምንም አይደለም።'
                    : 'An account saves your progress for your future. Google login shares your Google name and email; email login shares only an address — nothing else.'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsPrivacyOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {isAmharic ? 'ግላዊነት እና ደንቦች ያንብቡ' : 'Read Privacy & Terms'}
          </button>
          <button
            onClick={() => setIsContactOpen(true)}
            className="mt-1 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--app-text-muted, #475569)' }}
          >
            <AtSign className="w-3.5 h-3.5" />
            {isAmharic ? 'አግኙን' : 'Contact us'}
          </button>
        </motion.div>
      </div>
      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} language={language} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} language={language} />
    </AnimatePresence>
  );
};