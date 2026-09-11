import React from 'react';
import { Link } from 'react-router-dom';
import { Infinity as InfinityIcon, ShieldCheck, Wifi, BookOpen, Mail } from 'lucide-react';
import { LanguageMode } from '../types';
import { SiteHeader } from '../components/SiteHeader';
import { PrivacyModal } from '../components/PrivacyModal';

interface SiteLayoutProps {
  language: LanguageMode;
  onToggleLanguage: () => void;
  children: React.ReactNode;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ language, onToggleLanguage, children }) => {
  const isAmharic = language === 'am';
  const [isPrivacyOpen, setPrivacyOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const trustBadges = [
    {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: isAmharic ? 'ያለ ቁልፍ ይሰራል' : 'Works without an AI key'
    },
    {
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: isAmharic ? 'መረጃዎ በራስዎ መሳሪያ' : 'Your data stays on your device'
    },
    {
      icon: <InfinityIcon className="w-3.5 h-3.5" />,
      label: isAmharic ? 'እንግሊዝኛ + አማርኛ' : 'English + Amharic'
    }
  ];

  return (
    <div
      ref={rootRef}
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)'
      }}
      className="awde-site site-scroll h-screen w-screen overflow-y-auto overflow-x-hidden flex flex-col"
    >
      {/* Manuscript grain — same quiet paper texture as the landing page. */}
      <div aria-hidden className="fixed inset-0 z-[3] pointer-events-none grain opacity-[0.055] mix-blend-multiply" />

      <SiteHeader language={language} onToggleLanguage={onToggleLanguage} scrollRef={rootRef} />

      <main className="max-w-5xl mx-auto w-full px-6 sm:px-10 flex-1">{children}</main>

      <footer className="max-w-5xl mx-auto w-full px-6 sm:px-10 shrink-0">
        <div
          className="pt-8 pb-12 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
        >
          <p className="text-xs" style={{ color: 'var(--app-text-muted, #475569)' }}>
            {isAmharic ? '© 2026 አውደ (Awde) — የተሰራው በኒው ኪብሩ' : '© 2026 Awde — Built by Lewi Kibru'}
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {trustBadges.map((badge, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--app-text-muted, #475569)' }}
              >
                {badge.icon}
                {badge.label}
              </span>
            ))}
            <Link
              to="/about"
              className="flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              {isAmharic ? 'ስለ እኛ' : 'About'}
            </Link>
            <button
              onClick={() => setPrivacyOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {isAmharic ? 'ግላዊነት እና ደንቦች' : 'Privacy & Terms'}
            </button>
            <Link
              to="/contact"
              className="flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--app-text-muted, #475569)' }}
            >
              <Mail className="w-3.5 h-3.5" />
              {isAmharic ? 'ያግኙን' : 'Contact us'}
            </Link>
          </div>
        </div>
      </footer>

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setPrivacyOpen(false)} language={language} />
    </div>
  );
};