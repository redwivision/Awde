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
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  Flame,
  Search,
  BookOpen,
  ArrowUpRight,
  Info,
  ShieldCheck,
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

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  unit,
  language,
  onSelectNode,
  selectedNodeId
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  const containerRef = useRef<HTMLDivElement>(null);
  const isAmharic = language === 'am';

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
    setZoom(1);
    setPan({ x: 30, y: 30 });
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

  // Calculate SVG curve paths between connected nodes
  const getNodeCenter = (nodeId: string) => {
    const node = unit.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + 130, y: node.y + 75 };
  };

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
              placeholder={isAmharic ? 'ጽንሰ-ሀሳቦችን ፈልግ...' : 'Search nodes...'}
              className="w-full sm:w-56 bg-slate-950/90 text-xs text-slate-100 placeholder-slate-500 pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950/90 text-xs text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 focus:outline-none"
            >
              <option value="all">{isAmharic ? 'ሁሉም ምድቦች' : 'All Categories'}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/90 text-xs text-slate-300 px-2.5 py-2 rounded-lg border border-slate-800 focus:outline-none"
            >
              <option value="all">{isAmharic ? 'ሁሉም ደረጃዎች' : 'All Status'}</option>
              <option value="unstudied">{isAmharic ? 'አልተጀመረም' : 'Unstudied'}</option>
              <option value="learning">{isAmharic ? 'በመማር ላይ' : 'Learning'}</option>
              <option value="feynman_tested">{isAmharic ? 'በፌይንማን የተረጋገጠ' : 'Feynman'}</option>
              <option value="mastered">{isAmharic ? 'የተካነ' : 'Mastered'}</option>
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
              <span className="hidden sm:inline">{isAmharic ? 'ካርታ' : 'Graph'}</span>
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
                const start = getNodeCenter(conn.from);
                const end = getNodeCenter(conn.to);
                if (!start.x || !end.x) return null;

                // Curved Bezier calculation
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const cx1 = start.x + dx * 0.45;
                const cy1 = start.y;
                const cx2 = start.x + dx * 0.55;
                const cy2 = end.y;

                const pathData = `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`;
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;

                return (
                  <g key={conn.id} className="opacity-85 hover:opacity-100 transition-opacity">
                    {/* Glow Shadow */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#3730A3"
                      strokeWidth="4"
                      strokeOpacity="0.3"
                    />
                    {/* Main Link Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2.5"
                      strokeDasharray={conn.relationType === 'depends_on' ? '6 4' : 'none'}
                      markerEnd="url(#arrowhead)"
                    />
                    {/* Edge Label Badge */}
                    <foreignObject
                      x={midX - 90}
                      y={midY - 14}
                      width="180"
                      height="28"
                      className="overflow-visible pointer-events-none"
                    >
                      <div className="flex justify-center items-center">
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-950/95 text-slate-200 border border-slate-800 shadow-md backdrop-blur-sm truncate max-w-[170px]">
                          {isAmharic && conn.labelAmharic ? conn.labelAmharic : conn.label}
                        </span>
                      </div>
                    </foreignObject>
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
                    left: `${node.x}px`,
                    top: `${node.y}px`,
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
                    {/* Top Row: Category and Mastery Progress */}
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
                        {isAmharic ? 'ፅንሰ-ሀሳቡን ክፈት →' : 'Open Concept →'}
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
                <h2 className="text-base font-bold text-white">
                  {isAmharic ? unit.titleAmharic : unit.title}
                </h2>
                <p className="text-xs text-slate-400">
                  {filteredNodes.length} {isAmharic ? 'ጽንሰ-ሀሳቦች ተገኝተዋል' : 'concepts available'}
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
                        💡 {node.localizedAnalogy.culturalElement}
                      </span>
                      <span className="text-indigo-400 shrink-0 font-bold ml-2">
                        {isAmharic ? 'አጥና' : 'Study'} →
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
            <span className="hidden sm:inline">{isAmharic ? 'የተካነ' : 'Mastered'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span className="hidden sm:inline">{isAmharic ? 'በፌይንማን የተረጋገጠ' : 'Feynman'}</span>
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
