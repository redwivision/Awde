/**
 * Desktop-only smooth scroll wrapper for the marketing pages.
 *
 * Uses Lenis root-mode (window scroll) so that sticky elements, anchors,
 * and IntersectionObserver all keep working naturally. Touch clients and
 * users who prefer reduced motion are left on native scroll.
 */
import React, { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export const LenisSmooth: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Smooth scroll breaks anchor links if smooth is false + browser scrolls;
    // so only mount on desktop non-reduced-motion environments.
    if (prefersReduced) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false, // always leave touch to native bounce
      anchors: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};
