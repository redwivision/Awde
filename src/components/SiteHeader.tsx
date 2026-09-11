import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { motion, AnimatePresence, useScroll } from 'motion/react';
import { LanguageMode } from '../types';
import { AwdeLogo } from './AwdeLogo';

interface SiteHeaderProps {
  language: LanguageMode;
  onToggleLanguage: () => void;
  /** Scroller to measure scroll progress from. Falls back to window. */
  scrollRef?: React.RefObject<HTMLElement | null>;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ language, onToggleLanguage, scrollRef }) => {
  const isAmharic = language === 'am';
  const [menuOpen, setMenuOpen] = React.useState(false);

  const { scrollYProgress } = scrollRef ? useScroll({ container: scrollRef }) : useScroll();

  const nav = [
    { to: '/', label: isAmharic ? 'መነሻ' : 'Home', end: true },
    { to: '/about', label: isAmharic ? 'ስለ እኛ' : 'About', end: false },
    { to: '/contact', label: isAmharic ? 'ያግኙን' : 'Contact', end: false }
  ];

  return (
    <header
      className="sticky top-0 z-40 relative"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--app-bg, #f1f5f9) 82%, transparent)',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        borderBottom: '1px solid var(--app-border, #cbd5e1)'
      }}
    >
      {/* Reading progress hairline — the only "logo-perfect" ink line in rule of thirds. */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left z-10"
        style={{
          scaleX: scrollYProgress,
          backgroundColor: 'var(--app-accent, #4f46e5)'
        }}
      />
      <div className="max-w-5xl mx-auto w-full px-6 sm:px-10">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="shrink-0" aria-label={isAmharic ? 'ወደ መነሻ ገጽ' : 'Awde home'}>
            <AwdeLogo size="md" isAmharic={isAmharic} tone="site" />
          </Link>

          <nav className="hidden sm:flex items-center gap-6" aria-label="Site navigation">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="text-sm font-medium transition-opacity hover:opacity-100"
                style={({ isActive }) => ({
                  color: isActive ? 'var(--app-accent, #4f46e5)' : 'var(--app-text, #020617)',
                  opacity: isActive ? 1 : 0.68
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-2.5 h-9 rounded-full text-xs font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text, #020617)' }}
              title={isAmharic ? 'Switch to English' : 'በአማርኛ ይመልከቱ'}
            >
              <Globe className="w-4 h-4" style={{ color: 'var(--app-accent, #4f46e5)' }} />
              {language === 'am' ? 'EN' : 'AM'}
            </button>

            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="sm:hidden flex items-center gap-1.5 px-2.5 h-9 rounded-full text-xs font-semibold transition-colors hover:bg-black/5"
              style={{ color: 'var(--app-text, #020617)' }}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{isAmharic ? 'ምናሌ' : 'Menu'}</span>
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="sm:hidden overflow-hidden"
              aria-label="Site navigation"
            >
              <div className="flex flex-col gap-1 pb-4">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-semibold transition-colors"
                    style={({ isActive }) => ({
                      color: isActive ? 'var(--app-accent, #4f46e5)' : 'var(--app-text, #020617)',
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--app-accent, #4f46e5) 8%, transparent)'
                        : undefined
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};