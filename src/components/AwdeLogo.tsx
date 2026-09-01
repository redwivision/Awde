import React from 'react';

interface AwdeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isAmharic?: boolean;
}

/**
 * Awde — The Rising Knowledge Sprout
 * A single bold geometric mark: a sprouting seedling whose stem is a synapse /
 * neural axon, its leaves folding into an open book, and roots reaching down.
 * It ties directly into Rooty's "knowledge antenna" sprout aesthetic and the
 * brand idea that understanding GROWS, it is not memorized.
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
      {/* Mark: Rising Knowledge Sprout */}
      <div
        style={{
          width: dim.icon,
          height: dim.icon,
          backgroundColor: 'var(--app-accent-bg, rgba(79, 70, 229, 0.14))',
          borderColor: 'var(--app-accent, #4f46e5)'
        }}
        className="relative shrink-0 rounded-xl p-1 border flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-label="Awde logo"
        >
          {/* Awde accent color */}
          <defs>
            <linearGradient id="awde-sprout" x1="0" y1="32" x2="16" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="var(--app-accent,#4f46e5)" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Roots — grounded knowledge below the soil line */}
          <g stroke="var(--app-accent,#4f46e5)" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
            <path d="M16 22 v-6" />
            <path d="M16 19 q-3 -0.5 -5 -1.5" />
            <path d="M16 20 q3 -0.5 5 -1" />
          </g>

          {/* Soil line */}
          <line x1="10" y1="24" x2="22" y2="24" stroke="var(--app-accent,#4f46e5)" strokeWidth="1.3" strokeLinecap="round" opacity="0.35" />

          {/* Stem = synapse / axon, curving up */}
          <path
            d="M16 22 C16 17 16 15 16 10"
            stroke="url(#awde-sprout)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Synapse pulses along the stem */}
          <circle cx="16" cy="16" r="1.1" fill="var(--app-accent,#4f46e5)" opacity="0.85" />

          {/* Left leaf = open book */}
          <path
            d="M16 10 C13 7 11 8 9.5 11 C13 10.5 15 11 16 12.5"
            fill="url(#awde-sprout)"
            stroke="var(--app-accent,#4f46e5)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Right leaf = upward growth */}
          <path
            d="M16 8.5 C18.5 5.5 21.5 5.5 23.5 8 C21 9 18.5 9 16 11"
            fill="url(#awde-sprout)"
            stroke="var(--app-accent,#4f46e5)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Seed / spark at tip */}
          <circle cx="16" cy="7" r="1.6" fill="var(--app-accent,#4f46e5)" />
          <circle cx="17.4" cy="5.6" r="0.9" fill="#06b6d4" opacity="0.9" />
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
