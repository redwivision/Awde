import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ConceptNode,
  LanguageMode,
  TopicUnit
} from '../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Layers,
  Search,
  BookOpen,
  ArrowUpRight,
  LayoutGrid,
  MapPin,
  Move
} from 'lucide-react';

interface MindMapCanvasProps {
  unit: TopicUnit;
  language: LanguageMode;
  onSelectNode: (node: ConceptNode) => void;
  selectedNodeId?: string;
}

// Categories drawn as columns, so a unit always renders as a real map instead
// of the flat horizontal row that raw AI/seed coordinates tend to produce.
const CATEGORY_ORDER = ['Foundation', 'Mechanism', 'Core Law', 'Real-World App'];

const CARD_W = 260;
const CARD_H = 175;
const COL_STEP_X = 340;
const ROW_STEP_Y = 215;
const EDGE_CORNER_R = 14;

// Column gap lanes the edges run through, so lines never cross card content.
// Gap of column c spans [c.x + CARD_W, (c+1).x]; its center is the lane.
function laneXOf(column: number): number {
  return 140 + column * COL_STEP_X + CARD_W + (COL_STEP_X - CARD_W) / 2;
}

const sgn = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);

function columnIndexOf(posX: number): number {
  return Math.round((posX - 140) / COL_STEP_X);
}

// Route an edge as an orthogonal path with rounded corners along the thin gap
// between node columns (matching a classic flowchart / metro-map look). Returns
// the SVG path plus the midpoint where the edge label should sit.
function routeEdge(
  from: { x: number; y: number },
  to: { x: number; y: number }
): { path: string; midX: number; midY: number } {
  const cFrom = columnIndexOf(from.x);
  const cTo = columnIndexOf(to.x);
  const y0 = from.y + CARD_H / 2;
  const y1 = to.y + CARD_H / 2;

  if (cFrom === cTo) {
    // Same column: connect through the lane to the right of the column, from the
    // vertical edge that points toward the destination. Arrow stays sensible for
    // both up and down connections.
    const goingDown = from.y <= to.y;
    const x0 = from.x + CARD_W / 2;
    const x1 = to.x + CARD_W / 2;
    const startY = goingDown ? from.y + CARD_H : from.y;
    const endY = goingDown ? to.y : to.y + CARD_H;
    const laneX = laneXOf(cFrom);
    const dy = endY - startY;
    if (Math.abs(dy) < 1) {
      return { path: `M ${x0} ${startY} L ${x1} ${endY}`, midX: laneX, midY: (startY + endY) / 2 };
    }
    const r = Math.min(EDGE_CORNER_R, Math.abs(dy) / 2);
    const dirY = sgn(dy);
    const d = [
      `M ${x0} ${startY}`,
      `L ${laneX} ${startY}`,
      `Q ${laneX} ${startY}, ${laneX} ${startY + dirY * r}`,
      `L ${laneX} ${endY - dirY * r}`,
      `Q ${laneX} ${endY}, ${laneX} ${endY}`,
      `L ${x1} ${endY}`
    ].join(' ');
    return { path: d, midX: laneX, midY: (startY + endY) / 2 };
  }

  const forward = cTo > cFrom;
  // Exit the source card on the side that heads toward the destination, and the
  // vertical run happens in the lane just outside the nearer column so the line
  // only ever travels through empty gaps.
  const x0 = forward ? from.x + CARD_W : from.x;
  const x3 = forward ? to.x : to.x + CARD_W;
  const laneX = forward ? laneXOf(cFrom) : laneXOf(cTo);
  const dx = laneX - x0;
  const dy = y1 - y0;
  if (Math.abs(dy) < 1 && Math.abs(dx) < 1) {
    return { path: `M ${x0} ${y0} L ${x3} ${y1}`, midX: (x0 + x3) / 2, midY: (y0 + y1) / 2 };
  }
  const r = Math.min(EDGE_CORNER_R, Math.abs(dy) / 2);
  const dirY = sgn(dy);
  const d = [
    `M ${x0} ${y0}`,
    `L ${laneX - sgn(dx) * r} ${y0}`,
    `Q ${laneX} ${y0}, ${laneX} ${y0 + dirY * r}`,
    `L ${laneX} ${y1 - dirY * r}`,
    `Q ${laneX} ${y1}, ${laneX + sgn(x3 - laneX) * r} ${y1}`,
    `L ${x3} ${y1}`
  ].join(' ');
  return { path: d, midX: laneX, midY: (y0 + y1) / 2 };
}

// Deterministic layout: one column per category (ordered so learning flows
// left → right), nodes stacked and vertically centered per column. AI-provided
// x/y are ignored for positioning, so the graph stays a legible map even when
// a provider returns degenerate or overlapping coordinates.
function computeMapLayout(nodes: ConceptNode[]): Record<string, { x: number; y: number }> {
  const columns = new Map<string, ConceptNode[]>();
  for (const n of nodes) {
    const list = columns.get(n.category) || [];
    list.push(n);
    columns.set(n.category, list);
  }

  const presentCategories = Array.from(columns.keys());
  const order = CATEGORY_ORDER.filter((c) => columns.has(c)).concat(
    presentCategories.filter((c) => !CATEGORY_ORDER.includes(c))
  );

  const positions: Record<string, { x: number; y: number }> = {};
  order.forEach((category, colIdx) => {
    const members = (columns.get(category) || []).slice().sort((a, b) => a.depthLevel - b.depthLevel);
    if (members.length === 0) return;
    const x = 140 + colIdx * COL_STEP_X;
    const stackH = members.length * ROW_STEP_Y;
    const startY = Math.max(90, 800 - stackH / 2);
    members.forEach((node, rowIdx) => {
      positions[node.id] = { x, y: startY + rowIdx * ROW_STEP_Y };
    });
  });

  return positions;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  unit,
  language,
  onSelectNode,
  selectedNodeId
}) => {
  const positions = React.useMemo(() => computeMapLayout(unit.nodes), [unit]);
  const [zoom, setZoom] = useState(() => {
    // On a narrow (mobile) screen the map opens zoomed out a bit so the whole
    // graph fits and is easier to pan around; desktop keeps the fuller view.
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 0.65 : 1;
  });
  const [pan, setPan] = useState(() => {
    const narrow = typeof window !== 'undefined' && window.innerWidth < 768;
    return narrow ? { x: -20, y: 20 } : { x: 40, y: 30 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  const containerRef = useRef<HTMLDivElement>(null);
  const isAmharic = language === 'am';

  // Fit the view so the whole map is visible and centered (instead of opening
  // at an arbitrary pan offset that leaves nodes cut off).
  const fitToLayout = React.useCallback(() => {
    const viewport = containerRef.current;
    if (!viewport) return;
    const ids = Object.keys(positions);
    if (ids.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of ids) {
      const p = positions[id];
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + CARD_W);
      maxY = Math.max(maxY, p.y + CARD_H);
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const cw = viewport.clientWidth;
    const ch = viewport.clientHeight;
    const zoom = Math.max(0.3, Math.min(1, Math.min(cw / w, ch / h) * 0.92));
    setZoom(zoom);
    setPan({
      x: cw / 2 - (minX + w / 2) * zoom,
      y: ch / 2 - (minY + h / 2) * zoom
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  useEffect(() => {
    fitToLayout();
  }, [fitToLayout]);

  // Drag pan handlers (Mouse & Touch)
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile canvas
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-node-card')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.45), 2.2));
  };

  const handleResetView = () => {
    fitToLayout();
  };

  // Node filtering
  const filteredNodes = unit.nodes.filter((node) => {
    const matchesSearch =
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.labelAmharic.includes(searchQuery) ||
      node.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || node.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || node.masteryStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const visibleNodeIds = React.useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const categories = Array.from(new Set(unit.nodes.map((n) => n.category)));

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none" id="mindmap-studio-canvas">
      {/* Top Floating Controls Bar */}
      <div className="p-3 sm:p-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md">
        {/* Left: Search and Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAmharic ? 'ሀሳቦችን ፈልግ...' : 'Search ideas...'}
              className="w-full sm:w-56 bg-slate-950/90 text-xs text-slate-100 placeholder-slate-500 pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950/90 text-xs text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 focus:outline-none"
            >
              <option value="all">{isAmharic ? 'ሁሉም' : 'All'}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/90 text-xs text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 focus:outline-none"
            >
              <option value="all">{isAmharic ? 'ሁሉም ደረጃዎች' : 'All Levels'}</option>
              <option value="unstudied">{isAmharic ? 'አልተጀመረም' : 'New'}</option>
              <option value="learning">{isAmharic ? 'በመማር ላይ' : 'Learning'}</option>
              <option value="feynman_tested">{isAmharic ? 'ለሩቲ የተነገረ' : 'Taught to Rooty'}</option>
              <option value="mastered">{isAmharic ? 'የተማረ' : 'Learned'}</option>
            </select>
          </div>
        </div>

        {/* Right: View mode toggle & Zoom controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Mobile/Desktop View Switcher: Graph Canvas vs List */}
          <div className="flex items-center bg-slate-950/90 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Graph Canvas View"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAmharic ? 'ካርታ' : 'Map'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAmharic ? 'ዝርዝር' : 'Cards'}</span>
            </button>
          </div>

          {/* Zoom Controls (when canvas view active) */}
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setZoom((z) => Math.min(z * 1.15, 2.2))}
                className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 px-1 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.max(z * 0.85, 0.45))}
                className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport: Either Interactive Canvas or Responsive Card Grid */}
      {viewMode === 'canvas' ? (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className={`w-full flex-1 cursor-grab active:cursor-grabbing relative overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] touch-none`}
          id="canvas-viewport"
        >
          {/* Subtle Mobile Drag Pan Hint */}
          <div className="md:hidden absolute top-3 left-3 z-10 pointer-events-none bg-slate-900/80 px-2 py-1 rounded-md text-[10px] text-slate-400 border border-slate-800 flex items-center gap-1">
            <Move className="w-3 h-3" />
            <span>{isAmharic ? 'ካርታውን ለማንቀሳቀስ ይጎትቱ' : 'Drag to pan canvas'}</span>
          </div>

          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.08s ease-out'
            }}
            className="absolute inset-0 w-[2400px] h-[1600px] pointer-events-none"
          >
            {/* SVG Connection Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
                </linearGradient>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#4F46E5" />
                </marker>
              </defs>

              {unit.connections.map((conn) => {
                const fromPos = positions[conn.from];
                const toPos = positions[conn.to];
                if (!fromPos || !toPos) return null;
                // Skip edges whose endpoints are hidden by search/filters.
                if (!visibleNodeIds.has(conn.from) || !visibleNodeIds.has(conn.to)) return null;

                const { path: pathData } = routeEdge(fromPos, toPos);

                return (
                  <g key={conn.id} className="opacity-85 pointer-events-none">
                    {/* Glow Shadow */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#3730A3"
                      strokeWidth="5"
                      strokeOpacity="0.28"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Main Link Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={conn.relationType === 'depends_on' ? '6 4' : 'none'}
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Interactive Mind Map Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const categoryColors: Record<string, { badge: string; border: string }> = {
                Foundation: {
                  badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
                  border: 'border-emerald-500/50 hover:border-emerald-400'
                },
                Mechanism: {
                  badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
                  border: 'border-cyan-500/50 hover:border-cyan-400'
                },
                'Core Law': {
                  badge: 'bg-purple-950/80 text-purple-300 border-purple-800',
                  border: 'border-purple-500/50 hover:border-purple-400'
                },
                'Real-World App': {
                  badge: 'bg-amber-950/80 text-amber-300 border-amber-800',
                  border: 'border-amber-500/50 hover:border-amber-400'
                }
              };

              const nodeTheme = categoryColors[node.category] || {
                badge: 'bg-slate-900 text-slate-300 border-slate-700',
                border: 'border-slate-700 hover:border-slate-500'
              };

              return (
                <div
                  key={node.id}
                  style={{
                    left: `${positions[node.id]?.x ?? node.x}px`,
                    top: `${positions[node.id]?.y ?? node.y}px`,
                    position: 'absolute'
                  }}
                  className="pointer-events-auto mindmap-node-card z-10"
                >
                  <motion.div
                    whileHover={{ scale: 1.03, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectNode(node)}
                    className={`w-[260px] rounded-xl bg-slate-900/95 border-2 ${nodeTheme.border} ${
                      isSelected
                        ? 'ring-2 ring-indigo-400 border-indigo-400 shadow-2xl shadow-indigo-500/20'
                        : 'shadow-xl'
                    } p-4 cursor-pointer transition-all duration-200 backdrop-blur-md`}
                    id={`node-card-${node.id}`}
                  >
                      {/* Top Row: Category and Learning Progress */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${nodeTheme.badge}`}>
                        {node.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-slate-300">
                          {node.masteryScore}%
                        </span>
                        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center p-0.5">
                          <div
                            style={{ width: `${node.masteryScore}%` }}
                            className={`h-full rounded-full ${
                              node.masteryScore >= 75
                                ? 'bg-emerald-400'
                                : node.masteryScore >= 40
                                ? 'bg-amber-400'
                                : 'bg-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Node Title */}
                    <h3 className="text-sm font-bold text-slate-100 tracking-tight leading-snug line-clamp-2">
                      {isAmharic ? node.labelAmharic : node.label}
                    </h3>
                    {isAmharic && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        {node.label}
                      </p>
                    )}

                    {/* Localized Analogy Hook Pill */}
                    <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-[11px] text-amber-300 font-medium truncate">
                          {node.localizedAnalogy.culturalElement}
                        </span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </div>

                    {/* Bottom Footer Details */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" />
                        Level {node.depthLevel}
                      </span>
                      <span className="text-indigo-400 font-medium hover:underline">
                        {isAmharic ? 'ሀሳቡን ክፈት →' : 'Open Idea →'}
                      </span>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mobile-Friendly Responsive Card Grid View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-display antialiased">
                  {isAmharic ? unit.titleAmharic : unit.title}
                </h2>
                <p className="text-xs text-slate-400">
                  {filteredNodes.length} {isAmharic ? 'ሀሳቦች ተገኝተዋል' : 'ideas available'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <motion.div
                    key={node.id}
                    whileHover={{ y: -2 }}
                    onClick={() => onSelectNode(node)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-slate-900/90 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                        {node.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {node.masteryScore}%
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      {isAmharic ? node.labelAmharic : node.label}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {isAmharic ? node.summaryAmharic : node.summary}
                    </p>

                    <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-amber-300 font-medium truncate">
                        {node.localizedAnalogy.culturalElement}
                      </span>
                      <span className="text-indigo-400 shrink-0 font-bold ml-2">
                        {isAmharic ? 'አጥና' : 'Study'} →
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Edge Label Badges — above nodes so branch text is always readable */}
            {unit.connections.map((conn) => {
              const fromPos = positions[conn.from];
              const toPos = positions[conn.to];
              if (!fromPos || !toPos) return null;
              if (!visibleNodeIds.has(conn.from) || !visibleNodeIds.has(conn.to)) return null;
              if (!(conn.label || conn.labelAmharic)) return null;
              const { midX, midY } = routeEdge(fromPos, toPos);
              return (
                <div
                  key={`edge-label-${conn.id}`}
                  className="absolute pointer-events-none"
                  style={{ left: midX - 92, top: midY - 13, width: 184 }}
                >
                  <div className="flex justify-center items-center">
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-950 text-slate-200 border border-slate-800 shadow-md truncate max-w-[176px]">
                      {isAmharic && conn.labelAmharic ? conn.labelAmharic : conn.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Sticky Unit Legend & Guidance */}
      <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">
            {isAmharic ? unit.titleAmharic : unit.title}
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">{unit.gradeOrLevel}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="hidden sm:inline">{isAmharic ? 'የተማረ' : 'Learned'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span className="hidden sm:inline">{isAmharic ? 'ለሩቲ የተነገረ' : 'Taught to Rooty'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="hidden sm:inline">{isAmharic ? 'በመማር ላይ' : 'Learning'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
