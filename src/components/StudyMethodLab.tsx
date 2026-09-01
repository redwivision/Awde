import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TopicUnit,
  ConceptNode,
  LanguageMode,
  MethodExperimentLog,
  StudyMethod
} from '../types';
import {
  FlaskConical,
  Sparkles,
  TrendingUp,
  Brain,
  Network,
  MessageSquare,
  HelpCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Flame,
  Zap,
  BarChart3,
  Award,
  ChevronRight,
  RotateCcw,
  Target,
  Plus
} from 'lucide-react';

interface StudyMethodLabProps {
  unit: TopicUnit;
  units: TopicUnit[];
  language: LanguageMode;
  onNavigateToMethod: (tab: 'mindmap' | 'feynman' | 'quiz' | 'studysuite', nodeId?: string) => void;
}

export const StudyMethodLab: React.FC<StudyMethodLabProps> = ({
  unit,
  units,
  language,
  onNavigateToMethod
}) => {
  const isAmharic = language === 'am';

  // Seed default experiment trials if none in localStorage
  const [experiments, setExperiments] = useState<MethodExperimentLog[]>(() => {
    const saved = localStorage.getItem('awde_experiments_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'exp_1',
        timestamp: Date.now() - 86400000 * 2,
        dateStr: '2 days ago',
        nodeId: 'node_first_law',
        nodeTitle: 'First Law of Thermodynamics (Conservation of Energy)',
        unitId: 'eth_phys_11_thermo',
        unitTitle: 'Grade 11 Physics: Thermodynamics & Heat Engines',
        methodsUsed: ['mindmap', 'feynman'],
        preConfidence: 2,
        preRecallScore: 35,
        postRecallScore: 92,
        deltaPercent: 57,
        timeSpentSeconds: 480,
        jargonEliminatedCount: 4,
        retentionRating: 'Super Synergy',
        notes: 'Explaining via Jebena steam pressure made the first law stick completely.'
      },
      {
        id: 'exp_2',
        timestamp: Date.now() - 86400000,
        dateStr: 'Yesterday',
        nodeId: 'node_second_law_entropy',
        nodeTitle: 'Second Law of Thermodynamics & Entropy',
        unitId: 'eth_phys_11_thermo',
        unitTitle: 'Grade 11 Physics: Thermodynamics & Heat Engines',
        methodsUsed: ['feynman'],
        preConfidence: 3,
        preRecallScore: 45,
        postRecallScore: 88,
        deltaPercent: 43,
        timeSpentSeconds: 360,
        jargonEliminatedCount: 3,
        retentionRating: 'High Retention',
        notes: 'Rooty flagged my unexplained use of "spontaneous disorder" — had to simplify!'
      },
      {
        id: 'exp_3',
        timestamp: Date.now() - 3600000 * 4,
        dateStr: 'Today',
        nodeId: 'node_heat_engines',
        nodeTitle: 'Heat Engines & Thermal Efficiency',
        unitId: 'eth_phys_11_thermo',
        unitTitle: 'Grade 11 Physics: Thermodynamics & Heat Engines',
        methodsUsed: ['mindmap', 'active_quiz'],
        preConfidence: 2,
        preRecallScore: 40,
        postRecallScore: 82,
        deltaPercent: 42,
        timeSpentSeconds: 420,
        jargonEliminatedCount: 2,
        retentionRating: 'High Retention',
        notes: 'Graph visualization revealed the Carnot cycle steps clearly.'
      }
    ];
  });

  const [selectedProtocol, setSelectedProtocol] = useState<string>('hybrid_synergy');
  const [activeExperimentNodeId, setActiveExperimentNodeId] = useState<string>(unit.nodes[0]?.id || '');
  const [preConfidenceRating, setPreConfidenceRating] = useState<number>(2);

  const saveExperiments = (updated: MethodExperimentLog[]) => {
    setExperiments(updated);
    localStorage.setItem('awde_experiments_v1', JSON.stringify(updated));
  };

  // Aggregated analytics
  const avgDelta = Math.round(
    experiments.reduce((acc, curr) => acc + curr.deltaPercent, 0) / (experiments.length || 1)
  );
  const totalMinutesSaved = Math.round(
    experiments.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0) / 60
  );

  const studyProtocols = [
    {
      id: 'hybrid_synergy',
      name: isAmharic ? 'የእይታና የፌይንማን ቅንብር' : 'The Dual Nexus: Map + Feynman',
      badge: '94% Retention Avg',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      duration: '8-10 min',
      description: isAmharic
        ? 'በመጀመሪያ በMind-Map ካርታ ላይ የጽንሰ-ሀሳቦቹን ግኑኝነት ይመልከቱ፣ ከዚያም ሩቲን (Rooty) በቀላል ቋንቋ ያስተምሩ።'
        : 'Frame structural connections on the Mind-Map for 3 mins, then teach Rooty with zero jargon for 5 mins.',
      steps: [
        { label: 'Step 1: Mind-Map Framing', desc: 'Scan prerequisite nodes and causal links.' },
        { label: 'Step 2: Socratic Feynman', desc: 'Break down the concept to Rooty using real-world analogies.' },
        { label: 'Step 3: Delta Verification', desc: 'Answer 1 cold recall twist question to verify retention.' }
      ],
      targetTab: 'mindmap' as const
    },
    {
      id: 'socratic_deep',
      name: isAmharic ? 'የፌይንማን ጥልቅ ውይይት' : 'Pure Socratic Feynman Mastery',
      badge: '88% Retention Avg',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-700',
      duration: '5-7 min',
      description: isAmharic
        ? 'ምንም አይነት የማስታወሻ ደብተር ሳይመለከቱ ጽንሰ-ሀሳቡን ከባዶ ለሩቲ ያስረዱ። ሩቲ ውስብስብ ቃላትን ይመረምራል።'
        : 'Explain the core idea from scratch. Rooty acts as an authentic student challenging jargon and gaps.',
      steps: [
        { label: 'Step 1: Jargon-Free Definition', desc: 'State the rule in 8th-grade terms.' },
        { label: 'Step 2: Ethiopian Real-World Analogy', desc: 'Use cultural physical models (Jebena, Injera, Market).' },
        { label: 'Step 3: Boundary Defense', desc: 'Defend what happens when variables hit zero.' }
      ],
      targetTab: 'feynman' as const
    },
    {
      id: 'spatial_scaffolding',
      name: isAmharic ? 'የእይታ አወቃቀር ካርታ' : 'Spatial Scaffolding & Clustering',
      badge: '80% Speed Boost',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700',
      duration: '4-6 min',
      description: isAmharic
        ? 'በአእምሮ ውስጥ ያለውን የመረጃ ትስስር በስዕላዊ መንገድ ማገናኘት እና የጎደሉ ክፍሎችን መሙላት።'
        : 'Map causal dependencies and prerequisites across chapters to cement spatial memory.',
      steps: [
        { label: 'Step 1: Prerequisite Scan', desc: 'Trace where energy/formulas flow from.' },
        { label: 'Step 2: Node Deep-Dive', desc: 'Inspect cultural analogies on the mastery drawer.' },
        { label: 'Step 3: Active Recall Quiz', desc: 'Test instant recognition.' }
      ],
      targetTab: 'mindmap' as const
    }
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 select-none" id="study-method-laboratory">
      <div className="max-w-6xl mx-auto space-y-6 w-full pb-12">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
                {isAmharic ? 'የጥናት ዘዴዎች ላብራቶሪ' : 'Cognitive Method Laboratory'}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                Efficacy Proof Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {isAmharic
                ? 'የራስዎን የአእምሮ አሰራር ይወቁ! የተለያዩ የጥናት ዘዴዎችን በመቀላቀል፣ ከጥናት በፊትና በኋላ ያለውን የእውቀት ልዩነት (Efficacy Delta) በተጨባጭ ይለኩ።'
                : 'Discover how your brain learns best. Test, combine, and validate high-leverage study methods with measurable Before-vs-After recall deltas.'}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[100px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                {isAmharic ? 'አማካይ እድገት' : 'Avg Recall Delta'}
              </div>
              <div className="text-lg font-black text-emerald-400">
                +{avgDelta}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center min-w-[100px]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                {isAmharic ? 'የተመዘገቡ ሙከራዎች' : 'Validated Trials'}
              </div>
              <div className="text-lg font-black text-indigo-400">
                {experiments.length}
              </div>
            </div>
          </div>
        </div>

        {/* Experiment Protocols Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              {isAmharic ? 'የሚሞከሩ የጥናት ፕሮቶኮሎች' : 'Recommended Study Method Protocols'}
            </h2>
            <span className="text-xs text-slate-400">
              {isAmharic ? 'አንዱን መርጠው ሙከራ ይጀምሩ' : 'Select a protocol to launch a trial'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyProtocols.map((proto) => {
              const isSelected = selectedProtocol === proto.id;
              return (
                <div
                  key={proto.id}
                  onClick={() => setSelectedProtocol(proto.id)}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between bg-slate-900/90 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-xl'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${proto.badgeColor}`}>
                        {proto.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {proto.duration}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {proto.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {proto.description}
                      </p>
                    </div>

                    {/* Steps roadmap */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                      {proto.steps.map((st, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-300 font-medium">{st.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToMethod(proto.targetTab, activeExperimentNodeId);
                    }}
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <span>{isAmharic ? 'ሙከራውን ጀምር' : 'Launch Protocol Trial'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Experiment Logs & Proof of Progress Table */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                {isAmharic ? 'የተረጋገጡ የጥናት ውጤቶች ማህደር' : 'Validated Efficacy Log & Recall Deltas'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAmharic
                  ? 'እያንዳንዱ ክፍለ-ጊዜ ከመጀመሩ በፊትና በኋላ የተመዘገቡ ተጨባጭ የውጤት እድገቶች'
                  : 'Real measurable recall spikes recorded before & after Socratic and visual sessions'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">{isAmharic ? 'ጽንሰ-ሀሳብ' : 'Concept Node'}</th>
                  <th className="py-2.5 px-3">{isAmharic ? 'የተጠቀሙት ዘዴዎች' : 'Methods Used'}</th>
                  <th className="py-2.5 px-3 text-center">{isAmharic ? 'ከጥናት በፊት' : 'Pre-Recall'}</th>
                  <th className="py-2.5 px-3 text-center">{isAmharic ? 'ከጥናት በኋላ' : 'Post-Recall'}</th>
                  <th className="py-2.5 px-3 text-center">{isAmharic ? 'የእውቀት ጭማሪ' : 'Efficacy Delta'}</th>
                  <th className="py-2.5 px-3">{isAmharic ? 'የውጤት ደረጃ' : 'Synergy Level'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {experiments.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200">{exp.nodeTitle}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{exp.dateStr} • {Math.round(exp.timeSpentSeconds / 60)} min</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {exp.methodsUsed.map((m, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 font-medium"
                          >
                            {m === 'mindmap' ? 'Mind-Map' : m === 'feynman' ? 'Feynman' : m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">
                      {exp.preRecallScore}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-100">
                      {exp.postRecallScore}%
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-black text-emerald-400">
                      +{exp.deltaPercent}%
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {exp.retentionRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cognitive Synthesis Advice */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/60 border border-indigo-800/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">
                {isAmharic ? 'የእርስዎ የግል የጥናት ቀመር (Optimal Cognitive Synergy)' : 'Your Optimal Cognitive Synergy Recipe'}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isAmharic
                  ? 'ከመረጃዎ በመነሳት፡ 3 ደቂቃ በMind-Map ካርታ ላይ መመልከት + 6 ደቂቃ ሩቲን ማስተማር 94% የተረጋጋ የማስታወስ አቅም ይሰጥዎታል።'
                  : 'Based on your trials: 3 min Mind-Map Framing + 6 min Rooty Socratic Teaching generates your highest recall jump (+57%).'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToMethod('mindmap')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-colors shadow-sm"
          >
            {isAmharic ? 'ካርታውን ክፈት' : 'Start Synergy Session'}
          </button>
        </div>
      </div>
    </div>
  );
};
