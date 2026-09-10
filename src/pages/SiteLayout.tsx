import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Infinity as InfinityIcon, ShieldCheck, Wifi, BookOpen, Mail, Languages } from 'lucide-react';
import { LanguageMode } from '../types';
import { AwdeLogo } from '../components/AwdeLogo';
import { PrivacyModal } from '../components/PrivacyModal';

interface SiteLayoutProps {
  language: LanguageMode;
  onToggleLanguage: () => void;
  children: React.ReactNode;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({ language, onToggleLanguage, children }) => {
  const isAmharic = language === 'am';
  const [isPrivacyOpen, setPrivacyOpen] = React.useState(false);
  const location = useLocation();

  const nav = [
    { to: '/', label: isAmharic ? 'መነሻ' : 'Home' },
    { to: '/about', label: isAmharic ? 'ስለ እኛ' : 'About' },
    { to: '/contact', label: isAmharic ? 'ያግኙን' : 'Contact' }
  ];

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
      style={{
        backgroundColor: 'var(--app-bg, #f1f5f9)',
        color: 'var(--app-text, #020617)'
      }}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden flex flex-col"
    >
      <header className="max-w-5xl mx-auto w-full px-6 sm:px-10 shrink-0">
        <div className="flex items-center justify-between py-6">
          <Link to="/" aria-label={isAmharic ? 'ወደ መነሻ ገጽ' : 'Go to Awde home'}>
            <AwdeLogo size="lg" isAmharic={isAmharic} />
          </Link>

          <nav className="hidden sm:flex items-center gap-1.5" aria-label="Main navigation">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => {
                  const base =
                    'px-3 py-2 rounded-full border text-xs font-semibold transition-all';
                  return isActive
                    ? `${base}`
                    : `${base} opacity-80 hover:opacity-100 hover:shadow-md hover:-translate-y-0.5`;
                }}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-text, #020617)',
                  color: 'var(--app-text, #020617)'
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
            >
              <Languages className="w-4 h-4" style={{ color: 'var(--app-accent, #4f46e5)' }} />
              {isAmharic ? 'Switch to English' : 'በአማርኛ ይመልከቱ'}
            </button>
          </div>
        </div>

        <nav className="sm:hidden flex items-center gap-1.5 -mt-2 pb-3" aria-label="Main navigation">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="px-3 py-2 rounded-full border text-xs font-semibold"
              style={{
                backgroundColor: 'var(--app-surface, #ffffff)',
                borderColor: location.pathname === item.to ? 'var(--app-text, #020617)' : 'var(--app-border, #cbd5e1)',
                color: 'var(--app-text, #020617)'
              }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

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