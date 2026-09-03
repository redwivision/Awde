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
      {/* Mark: the "Network" — a knowledge web converging into understanding */}
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
            <linearGradient id="awde-net-b" x1="16" y1="4" x2="16" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Connectors: three ideas converging into the base node */}
          <g stroke="url(#awde-net-b)" strokeWidth="2.2" strokeLinecap="round">
            <path d="M8 7 L16 21" />
            <path d="M16 7 L16 21" />
            <path d="M24 7 L16 21" />
          </g>
          {/* horizontal link among the three top ideas */}
          <path d="M8 7 L24 7" stroke="#059669" strokeWidth="1.4" strokeLinecap="round" />

          {/* Three idea nodes across the top */}
          <circle cx="8" cy="7" r="2.6" fill="#14b8a6" />
          <circle cx="16" cy="7" r="2.6" fill="#34d399" />
          <circle cx="24" cy="7" r="2.6" fill="#14b8a6" />

          {/* Converged understanding node (base) */}
          <circle cx="16" cy="21" r="3.6" fill="url(#awde-net-b)" />
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
            {isAmharic ? 'የእውቀት ማዳበሪያ' : 'Grow knowledge.'}
          </p>
        </div>
      )}
    </div>
  );
};