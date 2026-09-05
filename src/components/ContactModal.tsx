import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Mail, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { LanguageMode } from '../types';
import { postJson } from '../lib/api';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageMode;
}

/** In-app contact form. Sends straight to the Awde team via POST /api/contact
 *  (server/contact.ts → shared mail transport) — no mailto, no leaving the app.
 *  The team address is shown as fallback text for anyone who can't use it. */
export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, language }) => {
  const isAmharic = language === 'am';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [delivered, setDelivered] = useState(true);

  if (!isOpen) return null;

  const submit = async () => {
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus('error');
      setStatusMsg(isAmharic ? 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ ምላሽ መስጠት እንድንችል።' : 'Please enter a valid email so we can reply.');
      return;
    }
    if (!trimmedMessage) {
      setStatus('error');
      setStatusMsg(isAmharic ? 'እባክዎ መልዕክት ይፃፉ።' : 'Please write a message.');
      return;
    }
    setStatus('loading');
    setStatusMsg('');
    const res = await postJson<{ ok?: boolean; delivered?: boolean; error?: string; message?: string }>(
      '/api/contact',
      { name: name.trim(), email: trimmedEmail, message: trimmedMessage }
    );
    const data = res.data as any;
    if (res.ok && data?.ok) {
      setDelivered(data.delivered !== false);
      setStatus('sent');
      setStatusMsg(
        data.delivered !== false
          ? isAmharic
            ? 'እናመሰግናለን — መልዕክትዎ ደርሶናል። በ30 ቀናት ውስጥ እንመልሳለን።'
            : 'Thanks — we got your message and reply within 30 days.'
          : isAmharic
            ? 'መልዕክቱ ተመዝግቧል፤ ግን ይህ ሰርቨር ኢሜይል የመላክ አቅም የለውም። በቀጥታ ያነጋግሩ፡ lewikb13@gmail.com'
            : 'Message noted, but this server has no email configured. Please email lewikb13@gmail.com directly.'
      );
    } else {
      setStatus('error');
      setStatusMsg(data?.error || (isAmharic ? 'የተሳሳተ ነገር ተከስቷል። እባክዎ በኋላ ይሞክሩ።' : 'Something went wrong. Please try again shortly.'));
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
                  {isAmharic ? 'ያግኙን' : 'Contact us'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic ? 'ጥያቄ፣ ግብረ መልስ፣ ወይም የመሰረዝ ጥያቄ' : 'Questions, feedback, or deletion requests'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text-muted, #475569)' }}
              aria-label="Close contact form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {status === 'sent' ? (
              <div className="text-center space-y-4 py-6">
                <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: 'var(--app-accent, #6366f1)' }} />
                <p className="text-sm font-semibold leading-relaxed">{statusMsg}</p>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setStatusMsg('');
                    setName('');
                    setEmail('');
                    setMessage('');
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity"
                  style={{ backgroundColor: 'var(--app-accent, #6366f1)', color: '#ffffff' }}
                >
                  {isAmharic ? 'ጨርሰናል' : 'Done'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--app-text-muted, #475569)' }}>
                      {isAmharic ? 'ስም (አማራጭ)' : 'Name (optional)'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAmharic ? 'ስምዎ' : 'Your name'}
                      disabled={status === 'loading'}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 border"
                      style={{
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                        borderColor: 'var(--app-border, #cbd5e1)',
                        color: 'var(--app-text, #020617)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--app-text-muted, #475569)' }}>
                      {isAmharic ? 'ኢሜይል' : 'Email'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setStatus('idle');
                        setStatusMsg('');
                      }}
                      placeholder="you@example.com"
                      disabled={status === 'loading'}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 border"
                      style={{
                        backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                        borderColor: 'var(--app-border, #cbd5e1)',
                        color: 'var(--app-text, #020617)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--app-text-muted, #475569)' }}>
                    {isAmharic ? 'መልዕክት' : 'Message'}
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setStatus('idle');
                      setStatusMsg('');
                    }}
                    rows={5}
                    placeholder={isAmharic ? 'ምን ያስፈልገናል?' : 'How can we help?'}
                    disabled={status === 'loading'}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 border resize-none"
                    style={{
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                      borderColor: 'var(--app-border, #cbd5e1)',
                      color: 'var(--app-text, #020617)'
                    }}
                  />
                </div>

                <button
                  onClick={submit}
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: 'var(--app-accent, #6366f1)', color: '#ffffff' }}
                >
                  {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isAmharic ? 'መልዕክት ይላኩ' : 'Send message'}
                </button>

                {status === 'error' && statusMsg && (
                  <p className="text-xs leading-relaxed flex items-start gap-2" style={{ color: '#dc2626' }}>
                    <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    {statusMsg}
                  </p>
                )}

                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic
                    ? 'ወይም በቀጥታ ያነጋግሩት፡ lewikb13@gmail.com'
                    : 'You can also write to us directly at lewikb13@gmail.com. We respond within 30 days.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};