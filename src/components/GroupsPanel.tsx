import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  LogOut,
  ShieldCheck,
  BarChart3,
  Hash,
  Sparkles,
  TrendingUp,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { LanguageMode } from '../types';
import {
  StudyGroup,
  GroupRosterMember,
  GroupInsightConcept,
  createGroup,
  listGroups,
  joinGroup,
  fetchRoster,
  fetchInsights,
  leaveGroup
} from '../lib/groups';
import { getSession } from '../lib/sync';

interface GroupsPanelProps {
  language: LanguageMode;
}

export function GroupsPanel({ language }: GroupsPanelProps) {
  const isAmharic = language === 'am';
  const session = getSession();

  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [roster, setRoster] = useState<GroupRosterMember[]>([]);
  const [concepts, setConcepts] = useState<GroupInsightConcept[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  const t = (en: string, am: string) => (isAmharic ? am : en);

  const refresh = useCallback(async () => {
    const res = await listGroups();
    if (res.ok && res.data) {
      setGroups(res.data.groups ?? []);
      setError(null);
    } else if (res.data?.localMode) {
      setGroups([]);
    } else {
      setError(res.data?.error || t('Could not load groups.', 'ቡድኖችን ማምጣት አልተቻለም።'));
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listGroups();
      if (!cancelled) {
        if (res.ok && res.data) setGroups(res.data.groups ?? []);
        setError(res.ok ? null : (res.data?.error ?? null));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    const res = await createGroup(newName.trim());
    setCreating(false);
    if (res.ok && res.data?.group) {
      setNewName('');
      setShowCreate(false);
      setNotice(t('Group created!', 'ቡድን ተፈጥሯል!'));
      setGroups([res.data.group, ...groups]);
    } else {
      setError(res.data?.error || t('Could not create the group.', 'ቡድን መፍጠር አልተቻለም።'));
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    const name = displayName.trim();
    if (!code || !name) {
      setError(t('Please enter the group code and a display name.', 'የቡድን ኮድ እና የሚታይ ስም ያስገቡ።'));
      return;
    }
    setJoining(true);
    setError(null);
    const res = await joinGroup(code, name);
    setJoining(false);
    if (res.ok && res.data?.group) {
      setJoinCode('');
      setDisplayName('');
      setShowJoin(false);
      setNotice(t('Joined the group!', 'ቡድኑን ተቀላቅለዋል!'));
      setGroups([res.data.group, ...groups]);
    } else {
      setError(res.data?.error || t('Could not join that group.', 'ቡድኑን መቀላቀል አልተቻለም።'));
    }
  };

  const openGroup = async (g: StudyGroup) => {
    setSelectedGroup(g);
    setDetailLoading(true);
    const [r, i] = await Promise.all([fetchRoster(g.id), fetchInsights(g.id)]);
    if (r.ok && r.data) {
      setRoster(r.data.members ?? []);
      setMemberCount(r.data.memberCount ?? (r.data.members?.length ?? 0));
    } else {
      setRoster([]);
      setError(r.data?.error || t('Could not load the roster.', 'ዝርዝሩን ማምጣት አልተቻለም።'));
    }
    if (i.ok && i.data) {
      setConcepts(i.data.concepts ?? []);
    } else {
      setConcepts([]);
    }
    setDetailLoading(false);
  };

  const handleLeave = async () => {
    if (!selectedGroup) return;
    const res = await leaveGroup(selectedGroup.id);
    if (res.ok) {
      setNotice(
        res.data?.deleted
          ? t('Group deleted.', 'ቡድኑ ተሰርዟል።')
          : t('You left the group. Your data is no longer shared.', 'ቡድኑን ትተዋል። ውሂብዎ ከእንግዲህ አይጋራም።')
      );
      setGroups(groups.filter((g) => g.id !== selectedGroup.id));
      setSelectedGroup(null);
      setRoster([]);
      setConcepts([]);
    } else {
      setError(res.data?.error || t('Could not leave the group.', 'ቡድኑን መተው አልተቻለም።'));
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950 px-4 sm:px-8 py-6 space-y-6">
      {/* Consent / anonymity banner */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <EyeOff className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300 space-y-1">
          <p className="font-semibold text-slate-200">
            {t('Voluntary. Anonymous. You can leave any time.', 'በፈቃድ። ስም-አልባ። በማንኛውም ጊዜ መውጣት ይችላሉ።')}
          </p>
          <p>
            {t(
              'Join a study group to share only your aggregated stats (quiz averages, mastery, focus minutes, streak) under a name you choose. Your real identity, email, and explanations are never shared. Leaving removes your data instantly.',
              'የተመረጡ አሃዞችዎን (የፈተና አማካይ፣ የመለማመድ ደረጃ፣ የትኩረት ደቂቃዎች፣ ቀጣይነት) በራስዎ በተመረጠ ስም ብቻ ለመጋራት የጥናት ቡድን ይቀላቀሉ። እውነተኛ ማንነትዎ፣ ኢሜይልዎ እና ማብራሪያዎችዎ በጭራሽ አይጋሩም። መውጣት ውሂብዎን ወዲያውኑ ያስወግዳል።'
            )}
          </p>
        </div>
      </div>

      {!session && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
          {t(
            'You need to sign in to create or join groups.',
            'ቡድኖችን ለመፍጠር ወይም ለመቀላቀል መግባት ያስፈልግዎታል።'
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {notice}
        </div>
      )}

      {/* Selected group detail */}
      {selectedGroup ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-xs font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
          >
            ← {t('All groups', 'ሁሉም ቡድኖች')}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-100">{selectedGroup.name}</h2>
              <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                {selectedGroup.code}
                <span className="text-slate-600">·</span>
                {selectedGroup.owner
                  ? t('you own this group', 'ይህን ቡድን እርስዎ ነዎት')
                  : t('you joined this group', 'ይህን ቡድን ተቀላቅለዋል')}
              </p>
              {selectedGroup.owner && (
                <p className="text-xs text-slate-500 mt-2 max-w-md">
                  {t(
                    'Share this code with friends so they can join anonymously.',
                    'ጓደኞች በስም-አልባነት እንዲቀላቀሉ ይህን ኮድ ያካፍሉ።'
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!selectedGroup.owner && (
                <button
                  onClick={handleLeave}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('Leave group', 'ቡድኑን ይተው')}
                </button>
              )}
              {selectedGroup.owner && (
                <button
                  onClick={handleLeave}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('Delete group', 'ቡድኑን ይሰርዙ')}
                </button>
              )}
            </div>
          </div>

          {detailLoading ? (
            <p className="text-sm text-slate-400">{t('Loading…', 'በመጫን ላይ…')}</p>
          ) : (
            <>
              {/* Roster */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-semibold text-slate-200">
                    {t('Members', 'አባላት')} ({roster.length})
                  </h3>
                </div>
                {roster.length === 0 ? (
                  <p className="text-sm text-slate-500">{t('No one has joined yet.', 'ገና ማንም አልተቀላቀለም።')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="pb-2 pr-3">{t('Name', 'ስም')}</th>
                          <th className="pb-2 pr-3">{t('Events', 'ክስተቶች')}</th>
                          <th className="pb-2 pr-3">{t('Quiz avg', 'የፈተና አማካይ')}</th>
                          <th className="pb-2 pr-3">{t('Mastery', 'መለማመድ')}</th>
                          <th className="pb-2 pr-3">{t('Focus (min)', 'ትኩረት (ደቂቃ)')}</th>
                          <th className="pb-2">{t('Streak', 'ቀጣይነት')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {roster.map((m, i) => (
                          <tr key={i}>
                            <td className="py-2 pr-3 font-medium text-slate-200">{m.displayName}</td>
                            <td className="py-2 pr-3 text-slate-400">{m.agg.totalEvents}</td>
                            <td className="py-2 pr-3 text-slate-400">{m.agg.quizAvg === null ? '—' : `${m.agg.quizAvg}%`}</td>
                            <td className="py-2 pr-3 text-slate-400">{m.agg.mastery === null ? '—' : `${m.agg.mastery}%`}</td>
                            <td className="py-2 pr-3 text-slate-400">{m.agg.focusMins}</td>
                            <td className="py-2 text-slate-400 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                              {m.agg.streak}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" />
                  {t('Members appear by the name they chose. Real identities are never shown.', 'አባላት በመረጡት ስም ይታያሉ። እውነተኛ ማንነት በጭራሽ አይታይም።')}
                </p>
              </div>

              {/* Insights */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-slate-200">
                    {t('Curriculum insights', 'የሥርዓተ-ትምህርት ግንዛቤዎች')}
                  </h3>
                </div>
                {concepts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    {t('No concept insights yet — they appear once members take quizzes.', 'ገና ምንም ግንዛቤ የለም — አባላት ፈተና ሲወስዱ ይታያሉ።')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {concepts.slice(0, 12).map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300 truncate">{c.unitTitle}</span>
                          <span className="text-slate-500">{c.difficulty}% {t('hard', 'ከባድ')}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${c.difficulty >= 60 ? 'bg-rose-500/70' : c.difficulty >= 35 ? 'bg-amber-500/70' : 'bg-emerald-500/70'}`}
                            style={{ width: `${Math.min(100, c.difficulty)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{c.attempts} {t('attempts', 'ሙከራዎች')} · avg {c.avgScore}%</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t('These are fully anonymous, group-wide trends so teachers can shape a better curriculum — not to single anyone out.', 'እነዚህ ሙሉ በሙሉ ስም-አልባ የቡድን አዝማሚያዎች ናቸው — ማንንም ለማግለል ሳይሆን መምህራን የተሻለ ሥርዓተ-ትምህርት እንዲቀርጹ ነው።')}
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Action buttons */}
          {session && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setShowJoin(false); setShowCreate(true); }}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('Create a group', 'ቡድን ይፍጠሩ')}
              </button>
              <button
                onClick={() => { setShowCreate(false); setShowJoin(true); }}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {t('Join with a code', 'በኮድ ይቀላቀሉ')}
              </button>
            </div>
          )}

          {/* Create form */}
          {showCreate && session && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 max-w-md">
              <h3 className="font-semibold text-slate-200">{t('New study group', 'አዲስ የጥናት ቡድን')}</h3>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('Group name', 'የቡድን ስም')}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
                >
                  {creating ? t('Creating…', 'በመፍጠር ላይ…') : t('Create', 'ፍጠር')}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  {t('Cancel', 'ይቅር')}
                </button>
              </div>
            </div>
          )}

          {/* Join form */}
          {showJoin && session && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 max-w-md">
              <h3 className="font-semibold text-slate-200">{t('Join a study group', 'የጥናት ቡድን ይቀላቀሉ')}</h3>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t('GROUP CODE', 'የቡድን ኮድ')}
                maxLength={12}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm tracking-widest text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('Display name others will see', 'ሌሎች የሚያዩት ስም')}
                maxLength={40}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500">
                {t('Your real email and identity are never shown to the group.', 'እውነተኛ ኢሜይልዎ እና ማንነትዎ ለቡድኑ በጭራሽ አይታዩም።')}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleJoin}
                  disabled={joining || !joinCode.trim() || !displayName.trim()}
                  className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
                >
                  {joining ? t('Joining…', 'በመቀላቀል ላይ…') : t('Join', 'ቀላቀል')}
                </button>
                <button
                  onClick={() => setShowJoin(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  {t('Cancel', 'ይቅር')}
                </button>
              </div>
            </div>
          )}

          {/* Group list */}
          {loading ? (
            <p className="text-sm text-slate-400">{t('Loading groups…', 'ቡድኖችን በመጫን ላይ…')}</p>
          ) : groups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">
                {session
                  ? t('No groups yet. Create one or join with a friend’s code.', 'ገና ቡድን የለም። አዲስ ይፍጠሩ ወይም በጓደኛ ኮድ ይቀላቀሉ።')
                  : t('Groups let friends and students share their progress — completely voluntarily.', 'ቡድኖች ጓደኞች እና ተማሪዎች በፍጹም ፈቃዳቸው ዕድገታቸውን እንዲጋሩ ያስችላቸዋል።')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => openGroup(g)}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-indigo-500/50 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Users className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="flex gap-1.5">
                      {g.owner && (
                        <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                          {t('owner', 'ባለቤት')}
                        </span>
                      )}
                      {g.joined && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          {t('joined', 'ተቀላቅሏል')}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-200">{g.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <Hash className="w-3.5 h-3.5" />
                    {g.code}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}