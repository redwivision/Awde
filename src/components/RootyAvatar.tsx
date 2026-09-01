import React from 'react';
import { motion } from 'motion/react';
import { RootyEmotion } from '../types';
import { Sparkles, AlertCircle, HelpCircle, CheckCircle2, ShieldAlert, Award, Brain } from 'lucide-react';

interface RootyAvatarProps {
  emotion?: RootyEmotion;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  strictnessMode?: 'gentle' | 'balanced' | 'ironclad';
  onClick?: () => void;
  className?: string;
}

export const RootyAvatar: React.FC<RootyAvatarProps> = ({
  emotion = 'neutral',
  size = 'md',
  isSpeaking = false,
  strictnessMode = 'balanced',
  onClick,
  className = ''
}) => {
  const sizeMap = {
    sm: { box: 'w-12 h-12', scale: 0.6, badge: 'text-[9px] px-1 py-0.5' },
    md: { box: 'w-24 h-24', scale: 1.0, badge: 'text-xs px-2 py-0.5' },
    lg: { box: 'w-36 h-36', scale: 1.4, badge: 'text-xs px-2.5 py-1' },
    xl: { box: 'w-48 h-48', scale: 1.8, badge: 'text-sm px-3 py-1' }
  };

  const getEmotionDetails = () => {
    switch (emotion) {
      case 'skeptical':
        return {
          label: 'Skeptical (ተጠራጣሪ)',
          desc: 'Needs concrete proof, no buzzwords',
          color: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
          icon: HelpCircle,
          glow: 'shadow-amber-500/20'
        };
      case 'confused':
        return {
          label: 'Confused (ግራ የተጋባች)',
          desc: 'Unclear structure or missing step',
          color: 'text-rose-400 bg-rose-950/60 border-rose-500/40',
          icon: AlertCircle,
          glow: 'shadow-rose-500/20'
        };
      case 'stern':
        return {
          label: 'Stern Rigor (ጠንካራ ፈታሽ)',
          desc: 'Refuses jargon. Explain to a child!',
          color: 'text-red-400 bg-red-950/60 border-red-500/40',
          icon: ShieldAlert,
          glow: 'shadow-red-500/30'
        };
      case 'intrigued':
        return {
          label: 'Intrigued (የተመሰጠች)',
          desc: 'Great analogy, keep going!',
          color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
          icon: Sparkles,
          glow: 'shadow-cyan-500/20'
        };
      case 'convinced':
        return {
          label: 'Convinced (አመነች!)',
          desc: 'Crystal clear Feynman mastery',
          color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
          icon: CheckCircle2,
          glow: 'shadow-emerald-500/30'
        };
      case 'proud':
        return {
          label: 'Mastery Certified (የላቀ ብቃት!)',
          desc: 'Flawless intuitive explanation',
          color: 'text-amber-300 bg-amber-900/60 border-amber-400/50',
          icon: Award,
          glow: 'shadow-amber-400/40'
        };
      case 'challenging':
        return {
          label: 'Challenging (ፈታኝ ጥያቄ)',
          desc: 'Testing your boundary conditions',
          color: 'text-purple-400 bg-purple-950/60 border-purple-500/40',
          icon: Brain,
          glow: 'shadow-purple-500/20'
        };
      case 'neutral':
      default:
        return {
          label: 'Listening (እያዳመጠች ነው)',
          desc: 'Ready to learn from you',
          color: 'text-slate-300 bg-slate-900/80 border-slate-700/50',
          icon: Brain,
          glow: 'shadow-slate-500/10'
        };
    }
  };

  const details = getEmotionDetails();
  const IconComp = details.icon;

  // Emotion-driven SVG face features
  const renderEyes = () => {
    switch (emotion) {
      case 'skeptical':
        return (
          <>
            {/* Left eye normal, right eye narrowed with arched brow */}
            <path d="M28 42 Q36 38 44 42" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="45" r="4" fill="#38BDF8" />
            <path d="M56 46 Q64 45 72 47" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <ellipse cx="64" cy="48" rx="4" ry="2.5" fill="#38BDF8" />
            {/* Eyebrows */}
            <path d="M26 36 Q36 34 44 38" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 38 Q64 30 74 32" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'confused':
        return (
          <>
            {/* Swirly or mismatched eyes */}
            <ellipse cx="36" cy="46" rx="4.5" ry="3" fill="#FB7185" />
            <ellipse cx="64" cy="44" rx="3" ry="4.5" fill="#FB7185" />
            {/* Tilted asymmetrical brows */}
            <path d="M26 38 Q36 30 44 36" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 36 Q64 42 74 36" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'stern':
        return (
          <>
            {/* Sharp focused angled eyes */}
            <path d="M28 44 L44 46" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="36" cy="47" rx="3.5" ry="2" fill="#EF4444" />
            <path d="M56 46 L72 44" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="64" cy="47" rx="3.5" ry="2" fill="#EF4444" />
            {/* V-shaped stern brow */}
            <path d="M26 34 L44 40" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M56 40 L74 34" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'intrigued':
        return (
          <>
            {/* Wide sparkling inquisitive eyes */}
            <circle cx="36" cy="45" r="6" fill="#22D3EE" />
            <circle cx="38" cy="43" r="2" fill="#FFFFFF" />
            <circle cx="64" cy="45" r="6" fill="#22D3EE" />
            <circle cx="66" cy="43" r="2" fill="#FFFFFF" />
            {/* Raised soft curved brows */}
            <path d="M26 33 Q36 29 44 33" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 33 Q64 29 74 33" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
      case 'convinced':
      case 'proud':
        return (
          <>
            {/* Happy crescent closed / beaming eyes */}
            <path d="M28 46 Q36 38 44 46" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M56 46 Q64 38 72 46" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* High gentle brows */}
            <path d="M26 33 Q36 29 44 33" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 33 Q64 29 74 33" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            {/* Rosy blush cheeks */}
            <circle cx="26" cy="52" r="4" fill="#F43F5E" opacity="0.35" />
            <circle cx="74" cy="52" r="4" fill="#F43F5E" opacity="0.35" />
          </>
        );
      case 'challenging':
        return (
          <>
            {/* Winking or smirk stare */}
            <path d="M28 44 Q36 41 44 44" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="46" r="3.5" fill="#A855F7" />
            <path d="M56 46 Q64 42 72 46" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" fill="none" />
            <ellipse cx="64" cy="47" rx="3.5" ry="2.5" fill="#A855F7" />
            <path d="M26 36 Q36 33 44 38" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 35 Q64 28 74 33" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'neutral':
      default:
        return (
          <>
            {/* Calm, attentive eyes */}
            <circle cx="36" cy="46" r="4.5" fill="#38BDF8" />
            <circle cx="37.5" cy="44.5" r="1.5" fill="#FFFFFF" />
            <circle cx="64" cy="46" r="4.5" fill="#38BDF8" />
            <circle cx="65.5" cy="44.5" r="1.5" fill="#FFFFFF" />
            <path d="M28 36 Q36 33 44 36" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M56 36 Q64 33 72 36" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          </>
        );
    }
  };

  const renderMouth = () => {
    switch (emotion) {
      case 'skeptical':
        return <path d="M42 62 Q50 63 58 59" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
      case 'confused':
        return <path d="M42 63 Q46 59 50 62 T58 60" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
      case 'stern':
        return <path d="M40 62 L60 62" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />;
      case 'intrigued':
        return <ellipse cx="50" cy="62" rx="4" ry="5" fill="#E2E8F0" />;
      case 'convinced':
      case 'proud':
        return (
          <path
            d="M38 58 Q50 70 62 58"
            stroke="#10B981"
            strokeWidth="3"
            strokeLinecap="round"
            fill="#064E3B"
          />
        );
      case 'challenging':
        return <path d="M42 62 Q52 66 60 58" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
      case 'neutral':
      default:
        return <path d="M42 61 Q50 64 58 61" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      id={`rooty-avatar-${emotion}`}
    >
      {/* Halo / Aura effect */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: emotion === 'proud' || emotion === 'convinced' ? [0.6, 0.9, 0.6] : [0.3, 0.5, 0.3]
        }}
        transition={{ repeat: Infinity, duration: isSpeaking ? 1.2 : 2.5, ease: 'easeInOut' }}
        className={`absolute inset-0 rounded-2xl blur-lg transition-all duration-500 ${
          emotion === 'proud'
            ? 'bg-amber-400/40'
            : emotion === 'convinced'
            ? 'bg-emerald-500/30'
            : emotion === 'stern'
            ? 'bg-red-500/25'
            : emotion === 'skeptical'
            ? 'bg-amber-500/20'
            : emotion === 'intrigued'
            ? 'bg-cyan-500/25'
            : 'bg-emerald-600/15'
        }`}
      />

      {/* Main Avatar Container */}
      <motion.div
        whileHover={{ scale: onClick ? 1.05 : 1 }}
        animate={{
          y: emotion === 'confused' ? [-1, 2, -1] : [0, -2, 0],
          rotate: emotion === 'confused' ? [-3, 3, -3] : emotion === 'skeptical' ? [-1.5, 0, -1.5] : 0
        }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
        className={`relative ${sizeMap[size].box} rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center p-1.5 shadow-xl backdrop-blur-md transition-all duration-300`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Background Core Glow */}
          <circle cx="50" cy="50" r="44" fill="#0B1120" stroke="#1E293B" strokeWidth="2" />

          {/* Root Sprout / Knowledge Antenna */}
          <g>
            {/* Base Stem */}
            <path d="M50 16 Q50 6 44 2" stroke="#10B981" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Sprout Leaves */}
            <path
              d="M44 2 Q40 0 36 4 Q38 10 44 4 Z"
              fill="#34D399"
              stroke="#059669"
              strokeWidth="0.8"
            />
            <path
              d="M46 6 Q54 4 58 8 Q54 14 47 9 Z"
              fill="#10B981"
              stroke="#047857"
              strokeWidth="0.8"
            />
            {/* Intellect Crystal node */}
            <circle cx="44" cy="2" r="2.5" fill="#FBBF24" />
          </g>

          {/* Rooty Robotic Scholar Head Shell */}
          <rect
            x="18"
            y="22"
            width="64"
            height="56"
            rx="16"
            fill="#0F172A"
            stroke={
              emotion === 'stern'
                ? '#EF4444'
                : emotion === 'convinced' || emotion === 'proud'
                ? '#10B981'
                : emotion === 'skeptical'
                ? '#F59E0B'
                : '#334155'
            }
            strokeWidth="2.5"
          />

          {/* Screen Visor / Face Plate */}
          <rect x="22" y="28" width="56" height="44" rx="10" fill="#020617" />

          {/* Holographic Spec Glasses Frame */}
          <path
            d="M26 44 Q36 38 46 44 L54 44 Q64 38 74 44"
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeDasharray="2 1"
            fill="none"
            opacity="0.6"
          />

          {/* Dynamic Eyes & Brows */}
          {renderEyes()}

          {/* Dynamic Mouth */}
          {renderMouth()}

          {/* Side Scholar Audio Ears / Sensors */}
          <rect x="13" y="42" width="6" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <rect x="81" y="42" width="6" height="16" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1" />

          {/* Speaking Audio wave visualizer inside visor */}
          {isSpeaking && (
            <g opacity="0.8">
              <line x1="30" y1="67" x2="30" y2="71" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="38" y1="65" x2="38" y2="73" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <line x1="46" y1="64" x2="46" y2="74" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="54" y1="64" x2="54" y2="74" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="62" y1="65" x2="62" y2="73" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
              <line x1="70" y1="67" x2="70" y2="71" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}
        </svg>

        {/* Emotion Floating Indicator Pill */}
        <div
          className={`absolute -top-2 -right-2 p-1 rounded-full border shadow-md ${details.color} backdrop-blur-md`}
        >
          <IconComp className="w-3.5 h-3.5" />
        </div>
      </motion.div>

      {/* Strictness Level Badge if size is md or higher */}
      {(size === 'md' || size === 'lg' || size === 'xl') && (
        <div className="mt-2 text-center flex flex-col items-center">
          <span className={`inline-flex items-center gap-1 font-semibold rounded-md border ${details.color} ${sizeMap[size].badge}`}>
            <IconComp className="w-3 h-3" />
            <span>{details.label}</span>
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 max-w-[170px] truncate">
            {details.desc}
          </span>
        </div>
      )}
    </div>
  );
};
