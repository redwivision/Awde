import React from 'react';

interface AwdeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isAmharic?: boolean;
}

/**
 * Awde — The Knowledge Node / አውደ (Amharic for "seed")
 * A single bold geometric mark: a hexagonal knowledge hub with four
 * radiating network synapses, whose overall silhouette reads as a star —
 * nodding to the Star of Ethiopia. It expresses the app's core promise:
 * "seed-sized ideas that grow into connected knowledge structures."
 *
 * Reads clearly at 16px (collapsed sidebar) and 128px (hero / marketing).
 */
export const AwdeLogo: React.FC<AwdeLogoProps> = ({
  size = 'md',
  showText = true,
  isAmharic = false
}) => {
  const sizeMap = {
    sm: { icon: 28, word: 'text-[13px]', sub: 'text-[9px]', amharic: 'text-[10px]' },
    md: { icon: 36, word: 'text-base', sub: 'text-[10px]', amharic: 'text-xs' },
    lg: { icon: 48, word: 'text-xl', sub: 'text-xs', amharic: 'text-sm' }
  };

  const dim = sizeMap[size];

  return (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Mark: the "Mastery Core" — a hexagonal node ringed by mastery circles */}
      <div
        style={{
          width: dim.icon,
          height: dim.icon,
          backgroundColor: 'rgba(5, 150, 105, 0.12)',
          borderColor: '#059669'
        }}
        className="relative shrink-0 rounded-xl p-1 border flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-6 group-hover:shadow-md"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-label="Awde logo"
        >
          <defs>
            <linearGradient id="awde-core-a" x1="16" y1="10.2" x2="16" y2="21.8" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Outer mastery ring */}
          <circle cx="16" cy="16" r="12.6" fill="none" stroke="#059669" strokeWidth="1.7" />
          {/* Inner mastery ring */}
          <circle cx="16" cy="16" r="8.6" fill="none" stroke="#14b8a6" strokeWidth="1.7" />

          {/* Orbit nodes, symmetric at 90/210/330 deg on outer ring */}
          <circle cx="16" cy="4.9" r="1.5" fill="#14b8a6" />
          <circle cx="6.4" cy="10.9" r="1.3" fill="#059669" />
          <circle cx="25.6" cy="10.9" r="1.3" fill="#34d399" />

          {/* Central core: solid hexagonal knowledge node, centered (16,16) */}
          <path d="M16 9.8 L21 12.7 L21 19.3 L16 22.2 L11 19.3 L11 12.7 Z" fill="url(#awde-core-a)" />
        </svg>
      </div>

      {/* Wordmark — single clear label hierarchy */}
      {showText && (
        <div className="min-w-0 leading-none">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-black tracking-tight ${dim.word} leading-none`}
              style={{ color: 'var(--app-text, #f8fafc)' }}
            >
              Awde
            </span>
            {isAmharic && (
              <span
                className={`font-bold ${dim.amharic}`}
                style={{ color: 'var(--app-accent, #4f46e5)' }}
              >
                አውደ
              </span>
            )}
          </div>
          <p
            className={`font-medium ${dim.sub} mt-0.5 opacity-70`}
            style={{ color: 'var(--app-text-muted, #94a3b8)' }}
          >
            {isAmharic ? 'እወቅ፤ አብቅል' : 'Know it. Grow it.'}
          </p>
        </div>
      )}
    </div>
  );
};