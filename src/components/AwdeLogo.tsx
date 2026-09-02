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
      {/* Mark: Knowledge Node hub */}
      <div
        style={{
          width: dim.icon,
          height: dim.icon,
          backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.14))',
          borderColor: 'var(--app-accent, #4f46e5)'
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
            <linearGradient id="awde-node" x1="2" y1="30" x2="30" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--app-accent,#4f46e5)" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Radiating synapse lines forming a star silhouette */}
          <g stroke="url(#awde-node)" strokeWidth="1.7" strokeLinecap="round">
            <path d="M16 16 L16 6" />
            <path d="M16 16 L24 12" />
            <path d="M16 16 L24 22" />
            <path d="M16 16 L8 22" />
            <path d="M16 16 L8 10" />
            <path d="M16 16 L16 26" />
          </g>

          {/* Outer branch nodes */}
          <g fill="var(--app-accent,#4f46e5)">
            <circle cx="16" cy="5.5" r="1.7" />
            <circle cx="25" cy="11" r="1.5" />
            <circle cx="25" cy="21" r="1.5" fill="#06b6d4" />
            <circle cx="16" cy="26.5" r="1.7" fill="#06b6d4" />
            <circle cx="7" cy="21" r="1.5" />
            <circle cx="7" cy="10.5" r="1.5" />
          </g>

          {/* Central hub — hexagonal seed */}
          <path
            d="M16 12.6 L20.8 15.3 L20.8 20.7 L16 23.4 L11.2 20.7 L11.2 15.3 Z"
            fill="url(#awde-node)"
          />
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