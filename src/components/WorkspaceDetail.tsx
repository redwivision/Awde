import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Network,
  Sparkles,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MessageSquare,
  FileText,
  Clock,
  Info
} from 'lucide-react';
import { LanguageMode, TextbookWorkspace, ConceptNode } from '../types';
import { generateTextbookMultiLevelGraph } from '../data/textbookWorkspaces';

interface WorkspaceDetailProps {
  workspace: TextbookWorkspace;
  language: LanguageMode;
  onOpenUnit: (unitId: string, nodeId?: string) => void;
  onSelectNode: (node: ConceptNode, unitId?: string) => void;
  onBackToLibrary: () => void;
}

const BOOK_CENTER = { x: 500, y: 300 };

export const WorkspaceDetail: React.FC<WorkspaceDetailProps> = ({
  workspace,
  language,
  onOpenUnit,
  onSelectNode,
  onBackToLibrary
}) => {
  const isAmharic = language === 'am';
  const graph = useMemo(() => generateTextbookMultiLevelGraph(workspace), [workspace]);

  // zoom / pan state for the whole-book canvas
  const [zoom, setZoom] = useState(0.85);
  const [view, setView] = useState({ tx: 0, ty: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null);

  const nodeToUnit = useMemo(() => {
    const map = new Map<string, string>();
    workspace.units.forEach((u) => u.nodes.forEach((n) => map.set(n.id, u.id)));
    return map;
  }, [workspace]);

  const hasAnyTopics = graph.topicNodes.length > 0;

  const handleWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(2.4, Math.max(0.4, z * factor)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.wb-node')) return;
    panRef.current = { startX: e.clientX, startY: e.clientY, tx: view.tx, ty: view.ty };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    setView({
      tx: panRef.current.tx + (e.clientX - panRef.current.startX),
      ty: panRef.current.ty + (e.clientY - panRef.current.startY)
    });
  };

  const endPan = () => {
    panRef.current = null;
  };

  const resetView = () => {
    setZoom(0.85);
    setView({ tx: 0, ty: 0 });
  };

  const unitMastery = (unitId: string) => {
    const unit = workspace.units.find((u) => u.id === unitId);
    if (!unit || unit.nodes.length === 0) return 0;
    const done = unit.nodes.filter((n) => n.masteryScore >= 75).length;
    return Math.round((done / unit.nodes.length) * 100);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Book Header Hero */}
      <div className="shrink-0 px-4 sm:px-6 pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToLibrary}
            style={{ color: 'var(--app-text-muted, #475569)' }}
            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {isAmharic ? 'ወደ መጻሕፍት ማዕከል ተመለስ' : 'Back to Library'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Book Cover Tile */}
          <div
            className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-gradient-to-br ${workspace.coverColor} flex items-center justify-center shadow-lg shrink-0`}
          >
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-white/90" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <span
                style={{
                  backgroundColor: 'var(--app-accent-bg, rgba(79,70,229,0.12))',
                  color: 'var(--app-accent, #4f46e5)'
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {isAmharic ? workspace.subjectAmharic : workspace.subject}
              </span>
              <span style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] font-medium">
                {workspace.gradeOrLevel}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 leading-tight">
              {isAmharic ? workspace.titleAmharic : workspace.title}
            </h1>
            {workspace.sourcePdfName && (
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="flex items-center gap-1 text-[11px] mt-1">
                <FileText className="w-3 h-3" />
                {workspace.sourcePdfName}
              </p>
            )}
          </div>

          {/* Mastery Overview */}
          <div style={{ borderColor: 'var(--app-border, #cbd5e1)' }} className="shrink-0 sm:min-w-[190px] rounded-xl border p-3">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span style={{ color: 'var(--app-text-muted, #475569)' }}>
                {isAmharic ? 'አጠቃላይ ብቃት' : 'Overall Mastery'}
              </span>
              <span className="font-mono" style={{ color: 'var(--app-accent, #4f46e5)' }}>
                {workspace.overallMastery}%
              </span>
            </div>
            <div style={{ backgroundColor: 'var(--app-surface-elevated, #f8fafc)' }} className="w-full h-1.5 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${workspace.overallMastery}%`,
                  backgroundColor: 'var(--app-accent, #4f46e5)'
                }}
                className="h-full rounded-full transition-all duration-500"
              />
            </div>
            <div style={{ color: 'var(--app-text-muted, #475569)' }} className="flex items-center gap-3 text-[11px] mt-2">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> {workspace.units.length} {isAmharic ? 'ክፍሎች' : 'Units'}
              </span>
              <span className="flex items-center gap-1">
                <Network className="w-3 h-3" /> {graph.topicNodes.length} {isAmharic ? 'ርዕሶች' : 'Topics'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Whole-Book Multi-Level Mind-Map */}
        <div className="flex-1 min-h-0 relative" ref={containerRef}>
          <div
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPan}
            onPointerLeave={endPan}
            className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${view.tx}px, ${view.ty}px) scale(${zoom})`,
                transformOrigin: '0 0'
              }}
            >
              <svg
                width={1000}
                height={600}
                viewBox="0 0 1000 600"
                className="block"
                style={{ overflow: 'visible' }}
              >
                {/* Cross-Unit dashed links */}
                {graph.crossUnitConnections
                  .filter(
                    (c) =>
                      graph.topicNodes.some((n) => n.id === c.fromNodeId) ||
                      graph.topicNodes.some((n) => n.id === c.toNodeId)
                  )
                  .map((c) => {
                    const fromNode = graph.topicNodes.find((n) => n.id === c.fromNodeId);
                    const toNode = graph.topicNodes.find((n) => n.id === c.toNodeId);
                    if (!fromNode || !toNode) return null;
                    return (
                      <g key={c.id}>
                        <line
                          x1={fromNode.x}
                          y1={fromNode.y}
                          x2={toNode.x}
                          y2={toNode.y}
                          stroke="var(--app-accent, #4f46e5)"
                          strokeWidth={1.5}
                          strokeDasharray="6 5"
                          opacity={0.55}
                        />
                        <line
                          x1={(fromNode.x + toNode.x) / 2}
                          y1={(fromNode.y + toNode.y) / 2}
                          x2={(fromNode.x + toNode.x) / 2 + 8}
                          y2={(fromNode.y + toNode.y) / 2}
                          stroke="var(--app-accent, #4f46e5)"
                          strokeWidth={1.5}
                          opacity={0.55}
                        />
                      </g>
                    );
                  })}

                {/* Book root -> Unit hub + unit -> topic links */}
                {graph.connections.map((conn) => {
                  const from = conn.from === graph.bookNode.id
                    ? BOOK_CENTER
                    : graph.topicNodes.find((n) => n.id === conn.from) ||
                      graph.unitNodes.find((n) => n.id === conn.from);
                  const toPts =
                    conn.to === graph.bookNode.id
                      ? BOOK_CENTER
                      : graph.topicNodes.find((n) => n.id === conn.to) ||
                        graph.unitNodes.find((n) => n.id === conn.to);
                  if (!from || !toPts) return null;
                  return (
                    <line
                      key={conn.id}
                      x1={from.x}
                      y1={from.y}
                      x2={toPts.x}
                      y2={toPts.y}
                      stroke="var(--app-border-strong, #94a3b8)"
                      strokeWidth={1.2}
                      opacity={0.7}
                    />
                  );
                })}

                {/* Book Root Node */}
                <g className="wb-node" onClick={() => {}}>
                  <rect
                    x={BOOK_CENTER.x - 92}
                    y={BOOK_CENTER.y - 34}
                    width={184}
                    height={68}
                    rx={16}
                    fill="var(--app-accent, #4f46e5)"
                  />
                  <text
                    x={BOOK_CENTER.x}
                    y={BOOK_CENTER.y - 2}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={13}
                    fontWeight={800}
                  >
                    {isAmharic ? graph.bookNode.labelAmharic : graph.bookNode.label}
                  </text>
                  <text
                    x={BOOK_CENTER.x}
                    y={BOOK_CENTER.y + 16}
                    textAnchor="middle"
                    fill="#ffffff"
                    opacity={0.85}
                    fontSize={10}
                  >
                    {isAmharic ? 'የመጽሐፍ መነሻ' : 'Book Root'} • {graph.unitNodes.length} {isAmharic ? 'ክፍሎች' : 'Units'}
                  </text>
                </g>

                {/* Unit Hub Nodes */}
                {graph.unitNodes.map((uNode) => (
                  <g
                    key={uNode.id}
                    className="wb-node cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUnit(uNode.unitId);
                    }}
                  >
                    <rect
                      x={uNode.x - 78}
                      y={uNode.y - 26}
                      width={156}
                      height={52}
                      rx={13}
                      fill="var(--app-surface, #ffffff)"
                      stroke="var(--app-accent, #4f46e5)"
                      strokeWidth={2}
                    />
                    <text
                      x={uNode.x}
                      y={uNode.y - 4}
                      textAnchor="middle"
                      fill="var(--app-text, #020617)"
                      fontSize={11}
                      fontWeight={700}
                    >
                      {isAmharic ? uNode.labelAmharic : uNode.label}
                    </text>
                    <text
                      x={uNode.x}
                      y={uNode.y + 14}
                      textAnchor="middle"
                      fill="var(--app-text-muted, #475569)"
                      fontSize={9}
                    >
                      {uNode.mastery}% • {isAmharic ? 'መክፈት' : 'Open'}
                    </text>
                  </g>
                ))}

                {/* Topic Nodes */}
                {graph.topicNodes.map((tNode) => {
                  const unitId = nodeToUnit.get(tNode.id) || '';
                  return (
                    <g
                      key={tNode.id}
                      className="wb-node cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenUnit(unitId, tNode.id);
                      }}
                    >
                      <rect
                        x={tNode.x - 70}
                        y={tNode.y - 16}
                        width={140}
                        height={32}
                        rx={9}
                        fill="var(--app-surface-elevated, #f8fafc)"
                        stroke="var(--app-border, #cbd5e1)"
                        strokeWidth={1}
                      />
                      <text
                        x={tNode.x}
                        y={tNode.y + 3}
                        textAnchor="middle"
                        fill="var(--app-text, #020617)"
                        fontSize={9.5}
                        fontWeight={500}
                      >
                        {isAmharic ? tNode.labelAmharic : tNode.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Canvas controls */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.min(2.4, z * 1.15))}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text, #020617)'
                }}
                className="p-2.5 min-h-[40px] min-w-[40px] rounded-lg border shadow-sm hover:opacity-80"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.4, z / 1.15))}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text, #020617)'
                }}
                className="p-2.5 min-h-[40px] min-w-[40px] rounded-lg border shadow-sm hover:opacity-80"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text, #020617)'
                }}
                className="p-2.5 min-h-[40px] min-w-[40px] rounded-lg border shadow-sm hover:opacity-80"
                title="Reset view"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <span
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)',
                  color: 'var(--app-text-muted, #475569)'
                }}
                className="hidden sm:flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg border shadow-sm"
              >
                <Info className="w-3 h-3" />
                {isAmharic ? 'መጎተት / ማጉላት' : 'Drag to pan • Scroll to zoom'}
              </span>
            </div>

            {!hasAnyTopics && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  {isAmharic ? 'ይህ መጽሐፍ እስካሁን ምዕራፎች የሉትም። ከታች አዲስ ምዕራፍ ይጨምሩ።' : 'This book has no units yet. Add content below to get started.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Unit Shelf */}
        <div
          style={{ borderColor: 'var(--app-border, #cbd5e1)' }}
          className="shrink-0 lg:w-80 xl:w-96 overflow-y-auto border-t lg:border-t-0 lg:border-l"
        >
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4" style={{ color: 'var(--app-accent, #4f46e5)' }} />
                {isAmharic ? 'የመጽሐፉ ምዕራፎች' : 'Units & Chapters'}
              </h2>
              <span
                style={{ color: 'var(--app-text-muted, #475569)' }}
                className="text-[10px] font-mono"
              >
                {workspace.units.length} {isAmharic ? 'ክፍሎች' : 'units'}
              </span>
            </div>

            {workspace.units.map((unit, idx) => (
              <div
                key={unit.id}
                style={{
                  backgroundColor: 'var(--app-surface, #ffffff)',
                  borderColor: 'var(--app-border, #cbd5e1)'
                }}
                className="rounded-xl border p-3.5 space-y-2.5 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      style={{ color: 'var(--app-text-muted, #475569)' }}
                      className="text-[10px] font-mono font-semibold"
                    >
                      {unit.chapter || `Unit ${idx + 1}`}
                    </span>
                    <h3 className="text-sm font-bold mt-0.5 leading-snug">
                      {isAmharic ? unit.titleAmharic : unit.title}
                    </h3>
                    <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[11px] mt-1 line-clamp-2">
                      {isAmharic ? unit.descriptionAmharic : unit.description}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-semibold mb-1">
                    <span style={{ color: 'var(--app-text-muted, #475569)' }}>
                      {isAmharic ? 'ብቃት' : 'Mastery'}
                    </span>
                    <span className="font-mono" style={{ color: 'var(--app-accent, #4f46e5)' }}>
                      {unitMastery(unit.id)}%
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--app-surface-elevated, #f8fafc)' }} className="w-full h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${unitMastery(unit.id)}%`,
                        backgroundColor: 'var(--app-accent, #4f46e5)'
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenUnit(unit.id)}
                    style={{
                      backgroundColor: 'var(--app-accent, #4f46e5)',
                      color: 'var(--app-accent-text, #ffffff)'
                    }}
                    className="flex-1 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90 shadow-sm"
                  >
                    <Network className="w-3.5 h-3.5" />
                    {isAmharic ? 'ማይንድ-ማፕ' : 'Mind-Map'}
                  </button>
                  <button
                    onClick={() => {
                      if (unit.nodes[0]) onSelectNode(unit.nodes[0], unit.id);
                    }}
                    style={{
                      backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                      borderColor: 'var(--app-border, #cbd5e1)',
                      color: 'var(--app-text, #020617)'
                    }}
                    className="flex-1 px-3 py-2.5 min-h-[40px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border hover:opacity-80"
                  >
                    <MessageSquare className="w-3.5 h-3.5" style={{ color: 'var(--app-accent, #4f46e5)' }} />
                    {isAmharic ? 'ሩቲን' : 'Feynman'}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--app-text-muted, #475569)' }}>
                  <ChevronRight className="w-3 h-3" />
                  <span>
                    {unit.nodes.length} {isAmharic ? 'ርዕሶች' : 'topics'} •{' '}
                    {unit.quizQuestions.length} {isAmharic ? 'ጥያቄዎች' : 'Qs'} •{' '}
                    {unit.flashcards.length} {isAmharic ? 'ካርዶች' : 'flashcards'}
                  </span>
                </div>
              </div>
            ))}

            <div
              style={{
                backgroundColor: 'var(--app-surface-elevated, #f8fafc)',
                borderColor: 'var(--app-border-strong, #94a3b8)'
              }}
              className="rounded-xl border-2 border-dashed p-4 text-center"
            >
              <p className="text-[11px] font-semibold flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--app-accent, #4f46e5)' }} />
                {isAmharic ? 'ከአጠቃላይ መጻሕፍት ማዕከል አዲስ መጽሐፍ ያስገቡ' : 'Import a new textbook from the Library'}
              </p>
              <p style={{ color: 'var(--app-text-muted, #475569)' }} className="text-[10px] mt-1">
                {isAmharic ? 'አንድ መጽሐፍ ይጨምሩ' : 'Use "Import Textbook PDF" on the home page'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};