import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  CalendarCheck2,
  Award,
  Layers,
  Clock,
  ShieldCheck,
  Brain,
  TrendingUp,
  MessageSquareText,
  Cloud,
  CloudOff,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  LanguageMode
} from '../types';
import {
  StudyActivity,
  getStudyActivities,
  pullStudyActivities,
  getSession
} from '../lib/sync';

interface ProgressTimelineProps {
  language: LanguageMode;
}

function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function describeActivity(a: StudyActivity, isAmharic: boolean): { title: string; detail: string } {
  const nodeLabel = a.nodeLabel || '';
  const subject = a.unitTitle || '';
  switch (a.eventType) {
    case 'quiz':
      return {
        title: isAmharic
          ? `${subject} ፈተና ተሞልቷል — ${a.score}%`
          : `${subject} quiz · scored ${a.score}%`,
        detail: isAmharic ? nodeLabel : nodeLabel ? `${nodeLabel} mastered` : 'Quiz completed'
      };
    case 'feynman':
      return {
        title: isAmharic ? `ሩቲን አስተምረው ${subject} · ${a.score}%` : `Taught Rooty ${subject} · ${a.score}% clarity`,
        detail: nodeLabel || (isAmharic ? 'ሀሳብ' : 'Idea')
      };
    case 'mastery':
      return {
        title: isAmharic
          ? `${nodeLabel} ዝግጁ ነው`
          : `${nodeLabel} is mastered 🎯`,
        detail: subject || (isAmharic ? 'መማሪያ ክፍል' : 'In')
      };
    case 'blurting':
      return {
        title: isAmharic
          ? `${subject} በመዳገር ማስታወስ · accuracy ${a.accuracy}%`
          : `${subject} blurting · ${a.accuracy}% recall`,
        detail: isAmharic ? 'Demand & recall' : nodeLabel ? nodeLabel : 'Recall sprint'
      };
    case 'focus':
      return {
        title: isAmharic
          ? `${Math.round((a.seconds || 0) / 60)} ደቂቃ የተማሩ`
          : `Focused for ${Math.round((a.seconds || 0) / 60)} min`,
        detail: subject || (isAmharic ? 'ትኩረት' : 'Focus session')
      };
    default:
      return { title: subject || (isAmharic ? 'ተግባር' : 'Activity'), detail: '' };
  }
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ language }) => {
  const isAmharic = language === 'am';
  const [activities, setActivities] = useState<StudyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const local = getStudyActivities();
    setActivities(local);

    const session = getSession();
    if (!session) {
      setSynced(false);
      setLoading(false);
      return;
    }

    void pullStudyActivities(300).then((remote) => {
      if (cancelled || !remote) return;
      setSynced(true);
      setActivities((prev) => {
        const merged = remote.concat(prev);
        const seen = new Set<string>();
        return merged.filter((a) => {
          const key = `${a.ts}|${a.eventType}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const today = Date.now();
    const group = (ms: number) => Math.floor(ms / 86400000);
    const daySet = new Set<number>();
    for (const a of activities) daySet.add(group(a.ts as number));
    let streak = 0;
    let cursor = group(today);
    if (daySet.has(cursor)) {
      while (daySet.has(cursor)) {
        streak += 1;
        cursor -= 1;
      }
    } else if (daySet.has(cursor - 1)) {
      cursor -= 1;
      while (daySet.has(cursor)) {
        streak += 1;
        cursor -= 1;
      }
    }
    const todayCount = daySet.has(group(today)) ? 1 : 0;
    const scored = activities.filter((a) => typeof a.score === 'number');
    const accuracies = activities.filter((a) => typeof a.accuracy === 'number');
    const avg =
      accuracies.length > 0
        ? Math.round(accuracies.reduce((s, a) => s + (a.accuracy || 0), 0) / accuracies.length)
        : scored.length > 0
          ? Math.round(scored.reduce((s, a) => s + (a.score || 0), 0) / scored.length)
          : null;
    return { streak, todayCount, total: activities.length, avg };
  }, [activities]);

  const grouped = useMemo(() => {
    const groups: Record<string, StudyActivity[]> = {};
    for (const a of activities) {
      const ts = new Date(a.ts as number);
      const key = `${ts.getFullYear()}-${ts.getMonth()}-${ts.getDate()}`;
      (groups[key] ??= []).push(a);
    }
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, acts]) => {
        const d = new Date(key);
        const label = isSameDay(d.getTime(), Date.now())
          ? isAmharic ? 'ዛሬ' : 'Today'
          : isSameDay(d.getTime(), Date.now() - 86400000)
            ? isAmharic ? 'ትናንት' : 'Yesterday'
            : d.toLocaleDateString(isAmharic ? 'am-ET' : 'en-US', { month: 'short', day: 'numeric' });
        return { label, acts };
      });
  }, [activities, isAmharic]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 px-4 sm:px-8 py-6 space-y-6">
      {activities.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
          <Sparkles className="w-10 h-10 text-indigo-400" />
          <h2 className="text-lg font-bold">
            {isAmharic ? 'ገና ምንም እንቅስቃሴ የለም' : 'Your study history is empty'}
          </h2>
          <p className="text-sm text-slate-400 max-w-sm">
            {isAmharic
              ? 'የተማሩት ነገር እዚህ ይታያል። እንዲጀምሩ ወደ ፈተና (ፈተና) ወይም አስተምር ይሂዱ።'
              : 'Every quiz, taught idea, and focus session appears here. Start with a Quiz or Teach Rooty an idea.'}
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  {isAmharic ? 'ቀጣይነት' : 'Streak'}
                </span>
                <Flame className="w-4 h-4 text-orange-400" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.streak} {isAmharic ? 'ቀን' : 'day'}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  {isAmharic ? 'ዛሬ' : 'Today'}
                </span>
                <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.todayCount === 1 ? (isAmharic ? 'ተማረ' : 'studied') : (isAmharic ? 'አልተማረም' : 'not yet')}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  {isAmharic ? 'ድምር' : 'Total'}
                </span>
                <TrendingUp className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="mt-1 text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-slate-500">
                  {isAmharic ? 'አማካይ ውጤት' : 'Avg score'}
                </span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <p className="mt-1 text-2xl font-bold">
                {stats.avg === null ? '—' : `${stats.avg}%`}
              </p>
            </div>
          </div>

          {/* Sync state */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {synced ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAmharic ? 'ከመለያ ጋር የተመሳሰለ' : 'Synced with your account — visible on every device'}</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAmharic ? 'በዚህ መሣሪያ ብቻ ይጠበቃል' : 'Saved on this device only — sign in to sync across devices'}</span>
              </>
            )}
          </div>

          {/* Timeline */}
          {grouped.map(({ label, acts }) => (
            <div key={label} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</h3>
              <div className="space-y-2">
                {acts.map((a, i) => {
                  const { title, detail } = describeActivity(a, isAmharic);
                  const Icon =
                    a.eventType === 'quiz'
                      ? HelpCircle
                      : a.eventType === 'feynman'
                        ? MessageSquareText
                        : a.eventType === 'mastery'
                          ? ShieldCheck
                          : a.eventType === 'blurting'
                            ? Brain
                            : a.eventType === 'focus'
                              ? Clock
                              : Layers;
                  const time = new Date(a.ts as number).toLocaleTimeString(isAmharic ? 'am-ET' : 'en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  });
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-800/70 bg-slate-900/40 px-3 py-2.5">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-slate-500 truncate">{detail}</p>
                      </div>
                      <span className="text-xs text-slate-600">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};