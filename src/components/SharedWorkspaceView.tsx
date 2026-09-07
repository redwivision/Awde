import React, { useState } from 'react';
import { Globe, BookOpen, Sparkles } from 'lucide-react';
import {
  LanguageMode,
  TextbookWorkspace,
  TopicUnit,
  ConceptNode
} from '../types';
import { AwdeLogo } from './AwdeLogo';
import { MindMapCanvas } from './MindMapCanvas';
import { NodeMasteryDrawer } from './NodeMasteryDrawer';

interface SharedWorkspaceViewProps {
  workspace: TextbookWorkspace;
  language: LanguageMode;
  onToggleLanguage: () => void;
}

/**
 * Read-only preview rendered for a signed ?share=...&user=&id=&sig= link.
 * Reuses the real MindMapCanvas + NodeMasteryDrawer (in readOnly mode) so a
 * shared study map looks exactly like the owner's — but nothing can be
 * created, changed, saved, or billed to the visitor's AI quota.
 */
export const SharedWorkspaceView: React.FC<SharedWorkspaceViewProps> = ({
  workspace,
  language,
  onToggleLanguage
}) => {
  const isAmharic = language === 'am';
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    workspace.units[0]?.id || ''
  );
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const units = workspace.units || [];
  const currentUnit: TopicUnit | undefined = units.find((u) => u.id === selectedUnitId) || units[0];

  if (!currentUnit) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <AwdeLogo size="sm" showText={false} />
          <span>{isAmharic ? 'ይህ መጻሕፍት ባዶ ነው' : 'This workspace is empty.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 px-3 sm:px-5 flex items-center justify-between shrink-0 z-20 gap-3">
          <div className="flex items-center gap-2">
          <AwdeLogo size="sm" showText={false} />
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate leading-tight">
              {workspace.title || (isAmharic ? 'የተጋራ የጥናት ካርታ' : 'Shared study map')}
            </h1>
              <p className="text-[11px] text-slate-500 truncate leading-tight">
                {isAmharic
                  ? `በ ${currentUnit.chapter} • የመመልከቻ ቅድመ-እይታ`
                  : `In ${currentUnit.chapter} • Read-only preview`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Bilingual toggle mirrors the main app */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
              title="Toggle Amharic / English"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs">{language === 'am' ? 'AM' : 'EN'}</span>
            </button>

            {/* Study-it-yourself CTA */}
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'በ Awde ይማሩ' : 'Study it in Awde'}</span>
            </a>
          </div>
        </header>

        {/* Unit switcher (read-only selector) */}
        {units.length > 1 && (
          <div className="flex items-center gap-2 px-3 sm:px-5 pt-3 pb-1 overflow-x-auto shrink-0">
            {units.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 ${
                  u.id === currentUnit.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>{isAmharic && u.titleAmharic ? u.titleAmharic : u.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Read-only map */}
        <div className="flex-1 relative overflow-hidden">
          <MindMapCanvas
            unit={currentUnit}
            language={language}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setIsDrawerOpen(true);
            }}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Read-only concept drawer */}
        {isDrawerOpen && selectedNode && (
          <NodeMasteryDrawer
            node={selectedNode}
            unit={currentUnit}
            language={language}
            onClose={() => setIsDrawerOpen(false)}
            onStartFeynman={() => {}}
            onStartQuizForNode={() => {}}
            onMarkMastered={() => {}}
            readOnly
          />
        )}
      </main>
    </div>
  );
};