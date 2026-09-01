import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DesignAesthetic, LanguageMode } from '../types';
import { AESTHETIC_THEMES } from '../data/themes';
import { Palette, Check, Sparkles, X, Sun, Moon, Eye } from 'lucide-react';

interface AestheticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAesthetic: DesignAesthetic;
  onSelectAesthetic: (aesthetic: DesignAesthetic) => void;
  language: LanguageMode;
}

export const AestheticsModal: React.FC<AestheticsModalProps> = ({
  isOpen,
  onClose,
  currentAesthetic,
  onSelectAesthetic,
  language
}) => {
  const isAmharic = language === 'am';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
        {/* Backdrop click */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          id="design-aesthetics-modal"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {isAmharic ? 'የዲዛይን ውበት እና ገጽታ ይምረጡ' : 'Choose Design Aesthetic'}
                  </h2>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {AESTHETIC_THEMES.length} {isAmharic ? 'ገጽታዎች' : 'Styles'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAmharic
                    ? 'ለማጥናት ምቹ የሆነውን የገጽታ ቀለም እና የብርሃን መጠን ይምረጡ።'
                    : 'Personalize your learning environment. Changes apply across all visual tools & persist automatically.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close aesthetic chooser"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme List / Grid */}
          <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
            {AESTHETIC_THEMES.map((theme) => {
              const isSelected = currentAesthetic === theme.id;
              const isLight = theme.mode === 'light';

              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectAesthetic(theme.id)}
                  id={`aesthetic-option-${theme.id}`}
                  className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Left info & description */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Visual Color Swatches preview box */}
                    <div
                      className="w-14 h-14 rounded-xl border shrink-0 flex flex-col p-1.5 justify-between shadow-inner"
                      style={{
                        backgroundColor: theme.palette.bg,
                        borderColor: theme.palette.border
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.palette.accent }}
                        />
                        {isLight ? (
                          <Sun className="w-3 h-3 text-amber-500" />
                        ) : (
                          <Moon className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                      <div
                        className="h-2.5 w-full rounded"
                        style={{ backgroundColor: theme.palette.card, border: `1px solid ${theme.palette.border}` }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100 group-hover:text-white">
                          {isAmharic ? theme.nameAmharic : theme.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            isLight
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                              : 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60'
                          }`}
                        >
                          {isLight ? (isAmharic ? 'ነጭ ገጽታ' : 'Light Mode') : (isAmharic ? 'ጥቁር ገጽታ' : 'Dark Mode')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {isAmharic ? theme.taglineAmharic : theme.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Right side status / select action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    {/* Mini palette dots */}
                    <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: theme.palette.bg }}
                        title="Background"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: theme.palette.card }}
                        title="Surface"
                      />
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: theme.palette.accent }}
                        title="Accent"
                      />
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                        <Check className="w-4 h-4" />
                        <span>{isAmharic ? 'ተመርጧል' : 'Active'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAesthetic(theme.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
                      >
                        {isAmharic ? 'ይህን ምረጥ' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-800/90 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAmharic ? 'ምርጫዎ በራስ-ሰር ይቀመጣል' : 'Aesthetic choice is saved automatically.'}</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              {isAmharic ? 'ተከናውኗል' : 'Done'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
