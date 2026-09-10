import React, { useState } from 'react';
import { Send, Mail, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { LanguageMode } from '../types';
import { postJson } from '../lib/api';

interface ContactPageProps {
  language: LanguageMode;
}

export const ContactPage: React.FC<ContactPageProps> = ({ language }) => {
  const isAmharic = language === 'am';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string>('');

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

  const fieldStyle: React.CSSProperties = {
    backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
    borderColor: 'var(--app-border, #cbd5e1)',
    color: 'var(--app-text, #020617)'
  };

  return (
    <div className="py-16 sm:py-20">
      <div className="max-w-2xl mx-auto text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: 'var(--app-accent, #4f46e5)' }}>
          {isAmharic ? 'ያግኙን' : 'Contact'}
        </span>
        <h1 className="font-display antialiased mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          {isAmharic ? 'ያግኙን — ደስ ይለናል።' : 'Say hello — we read everything.'}
        </h1>
        <p className="mt-6 text-base sm:text-lg leading-relaxed" style={{ color: 'var(--app-text-muted, #475569)' }}>
          {isAmharic
            ? 'ጥያቄ፣ ግብረ መልስ፣ ወይም መረጃን የማጥፋት ጥያቄ — ይፃፉልን። በ30 ቀናት ውስጥ እንመልሳለን።'
            : 'Questions, feedback, or just an idea — we read everything. Write below and we reply within 30 days.'}
        </p>
      </div>

      <div
        className="mt-12 max-w-xl mx-auto rounded-2xl border p-8 shadow-xl"
        style={{
          backgroundColor: 'var(--app-surface, #ffffff)',
          borderColor: 'var(--app-border, #cbd5e1)',
          color: 'var(--app-text, #020617)'
        }}
      >
        {status === 'sent' ? (
          <div className="text-center space-y-4 py-8">
            <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: 'var(--app-accent, #4f46e5)' }} />
            <p className="text-sm font-semibold leading-relaxed">{statusMsg}</p>
            <button
              onClick={() => {
                setStatus('idle');
                setStatusMsg('');
                setName('');
                setEmail('');
                setMessage('');
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity"
              style={{ backgroundColor: 'var(--app-accent, #4f46e5)', color: 'var(--app-accent-text, #ffffff)' }}
            >
              {isAmharic ? 'ሌላ መልዕክት ይፃፉ' : 'Write another'}
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
                  style={fieldStyle}
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
                  style={fieldStyle}
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
                rows={6}
                placeholder={isAmharic ? 'ምን ያስፈልገናል?' : 'How can we help?'}
                disabled={status === 'loading'}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 border resize-none"
                style={fieldStyle}
              />
            </div>

            <button
              onClick={submit}
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--app-accent, #4f46e5)', color: 'var(--app-accent-text, #ffffff)' }}
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

            <p className="pt-2 text-[11px] leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--app-text-muted, #475569)' }}>
              <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {isAmharic
                ? 'ወይም በቀጥታ ያነጋግሩት፡ lewikb13@gmail.com'
                : 'You can also write to us directly at lewikb13@gmail.com.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};