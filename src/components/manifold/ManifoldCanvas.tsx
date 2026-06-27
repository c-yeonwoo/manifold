import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  loadNodes,
  loadEdges,
  LAYERS,
  EDGE_META,
  type ManifoldNode,
  type ManifoldEdge,
  type EdgeType,
} from "@/lib/manifold";
import { seedLifeOS } from "@/lib/manifold-seed";
import { useTheme } from "@/lib/theme";
import {
  W,
  H,
  NODE_W,
  NODE_H,
  LAYER_BAND,
  layoutNodes,
  clipToBox,
  type Placed,
} from "./layout";
import ActiveThreadsPanel from "./ActiveThreadsPanel";
import NodeDetail from "./NodeDetail";
import NodeForm from "./NodeForm";
import ReportImport from "./ReportImport";
import { Plus, FileText } from "lucide-react";

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

function useManifoldTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("manifold-updated", h);
      return () => window.removeEventListener("manifold-updated", h);
    },
    () => loadNodes().length + ":" + loadEdges().length
  );
}

const EDGE_STROKE: Record<EdgeType, string> = {
  feeds: "hsl(0 0% 55%)",
  reinforces: "hsl(170 55% 45%)",
  gates: "hsl(38 85% 52%)",
  feedbacks: "hsl(210 70% 58%)",
};

export default function ManifoldCanvas() {
  useManifoldTick();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const panState = useRef({ active: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const nodes = loadNodes();
  const edges = loadEdges();
  const placed = layoutNodes(nodes);

  const clientToSvg = useCallback((cx: number, cy: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: (cx - rect.left) * (W / rect.width), y: (cy - rect.top) * (H / rect.height) };
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const { x: mx, y: my } = clientToSvg(e.clientX, e.clientY);
      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
        const k = newScale / v.scale;
        return { x: mx - k * (mx - v.x), y: my - k * (my - v.y), scale: newScale };
      });
    },
    [clientToSvg]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    panState.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      origX: view.x,
      origY: view.y,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const s = panState.current;
    if (!s.active) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - s.startX) * (W / rect.width);
    const dy = (e.clientY - s.startY) * (H / rect.height);
    if (Math.abs(e.clientX - s.startX) + Math.abs(e.clientY - s.startY) > 3) s.moved = true;
    setView((v) => ({ ...v, x: s.origX + dx, y: s.origY + dy }));
  };
  const onPointerUp = () => {
    panState.current.active = false;
  };

  const zoomBy = (factor: number) => {
    setView((v) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const k = newScale / v.scale;
      const cx = W / 2;
      const cy = H / 2;
      return { x: cx - k * (cx - v.x), y: cy - k * (cy - v.y), scale: newScale };
    });
  };
  const reset = () => setView({ x: 0, y: 0, scale: 1 });

  const selectNode = (id: string) => {
    if (panState.current.moved) return;
    setSelectedId((cur) => (cur === id ? null : id));
  };

  // adjacency for highlight when a node is selected
  const incident = (edge: ManifoldEdge) =>
    selectedId != null && (edge.sourceId === selectedId || edge.targetId === selectedId);
  const connectedNodeIds = new Set<string>();
  if (selectedId) {
    connectedNodeIds.add(selectedId);
    edges.forEach((e) => {
      if (e.sourceId === selectedId) connectedNodeIds.add(e.targetId);
      if (e.targetId === selectedId) connectedNodeIds.add(e.sourceId);
    });
  }

  if (nodes.length === 0) {
    return <EmptyState />;
  }

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null;

  return (
    <div className="w-full relative">
      <ActiveThreadsPanel onSelect={(id) => setSelectedId(id)} />

      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button onClick={() => setAddOpen(true)} className="w-8 h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center" aria-label="노드 추가" title="노드 추가"><Plus className="w-4 h-4" /></button>
        <button onClick={() => setImportOpen(true)} className="w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-accent flex items-center justify-center" aria-label="리포트 가져오기" title="리포트 가져오기"><FileText className="w-3.5 h-3.5" /></button>
        <button onClick={() => zoomBy(1.2)} className="w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-accent text-sm" aria-label="zoom in">+</button>
        <button onClick={() => zoomBy(1 / 1.2)} className="w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-accent text-sm" aria-label="zoom out">−</button>
        <button onClick={reset} className="w-8 h-8 rounded-md bg-card border border-border text-muted-foreground hover:text-foreground text-[10px]" aria-label="reset" title="원위치">⟳</button>
      </div>

      <NodeForm open={addOpen} onOpenChange={setAddOpen} />
      <ReportImport open={importOpen} onOpenChange={setImportOpen} />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-5xl mx-auto select-none touch-none"
        style={{ minWidth: 720, cursor: panState.current.active ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          {(Object.keys(EDGE_STROKE) as EdgeType[]).map((t) => (
            <marker key={t} id={`mf-arrow-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={EDGE_STROKE[t]} />
            </marker>
          ))}
        </defs>

        <rect x={0} y={0} width={W} height={H} fill="transparent" onClick={() => { if (!panState.current.moved) setSelectedId(null); }} />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {/* layer bands */}
          {LAYERS.map((l) => {
            const band = LAYER_BAND[l.key];
            return (
              <g key={l.key}>
                <rect
                  x={28}
                  y={band.top}
                  width={W - 56}
                  height={band.height}
                  rx={16}
                  fill={`hsl(${l.hue} ${isLight ? 45 : 30}% ${isLight ? 96 : 11}%)`}
                  stroke={`hsl(${l.hue} 40% ${isLight ? 80 : 28}% / 0.5)`}
                  strokeWidth={1}
                />
                <text x={44} y={band.top + 22} fill={`hsl(${l.hue} 55% ${isLight ? 40 : 62}%)`} fontSize={12} fontWeight={600} style={{ fontFamily: "var(--mono-font)", letterSpacing: 2 }}>
                  {l.label}
                </text>
              </g>
            );
          })}

          {/* edges */}
          {edges.map((e) => {
            const a = placed.get(e.sourceId);
            const b = placed.get(e.targetId);
            if (!a || !b) return null;
            return (
              <EdgeShape
                key={e.id}
                edge={e}
                a={a}
                b={b}
                highlighted={incident(e)}
                dimmed={selectedId != null && !incident(e)}
              />
            );
          })}

          {/* nodes */}
          {Array.from(placed.values()).map((p) => (
            <NodeShape
              key={p.node.id}
              placed={p}
              isLight={isLight}
              selected={selectedId === p.node.id}
              dimmed={selectedId != null && !connectedNodeIds.has(p.node.id)}
              onClick={() => selectNode(p.node.id)}
            />
          ))}
        </g>
      </svg>

      {selected && <NodeDetail node={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function EdgeShape({
  edge,
  a,
  b,
  highlighted,
  dimmed,
}: {
  edge: ManifoldEdge;
  a: Placed;
  b: Placed;
  highlighted: boolean;
  dimmed: boolean;
}) {
  const stroke = EDGE_STROKE[edge.type];
  const meta = EDGE_META[edge.type];
  const start = clipToBox(b, a); // border point on a, toward b
  const end = clipToBox(a, b); // border point on b, toward a

  let d: string;
  let lx = (start.x + end.x) / 2;
  let ly = (start.y + end.y) / 2;
  if (edge.type === "feedbacks") {
    // bow out to the right to read as a return loop
    const mx = Math.max(start.x, end.x) + 90;
    const my = (start.y + end.y) / 2;
    d = `M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${end.y}, ${end.x} ${end.y}`;
    lx = mx - 8;
    ly = my;
  } else {
    d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  const op = dimmed ? 0.12 : highlighted ? 1 : 0.7;
  return (
    <g style={{ opacity: op, transition: "opacity 0.25s ease" }}>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={highlighted ? 2.4 : 1.6}
        strokeDasharray={meta.dashed ? "6 4" : edge.type === "gates" ? "2 3" : undefined}
        markerEnd={`url(#mf-arrow-${edge.type})`}
        markerStart={edge.type === "reinforces" ? `url(#mf-arrow-${edge.type})` : undefined}
      />
      {(highlighted || !dimmed) && edge.label && (
        <>
          <rect x={lx - edge.label.length * 3.4 - 4} y={ly - 9} width={edge.label.length * 6.8 + 8} height={16} rx={4} fill="hsl(var(--background))" opacity={0.85} />
          <text x={lx} y={ly + 2} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fill={stroke} style={{ fontFamily: "var(--mono-font)" }}>
            {edge.label}
          </text>
        </>
      )}
    </g>
  );
}

function NodeShape({
  placed,
  isLight,
  selected,
  dimmed,
  onClick,
}: {
  placed: Placed;
  isLight: boolean;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  const { node, x, y } = placed;
  const layer = LAYERS.find((l) => l.key === node.layer)!;
  const hue = layer.hue;
  const w = NODE_W;
  const h = NODE_H;
  const isActive = node.status === "active";
  const isDone = node.status === "done";
  const isQueued = node.status === "queued";

  const fill = isLight ? `hsl(${hue} 50% 97%)` : `hsl(${hue} 28% 13%)`;
  const stroke = isActive
    ? `hsl(${hue} 70% 55%)`
    : isDone
    ? `hsl(${hue} 25% 45%)`
    : `hsl(${hue} 40% ${isLight ? 70 : 45}%)`;

  const title = node.title.length > 16 ? node.title.slice(0, 16) + "…" : node.title;

  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer", opacity: dimmed ? 0.28 : isDone ? 0.7 : 1, transition: "opacity 0.25s ease" }}
    >
      <title>{node.title}</title>
      {isActive && (
        <rect x={x - w / 2 - 3} y={y - h / 2 - 3} width={w + 6} height={h + 6} rx={14} fill="none" stroke={`hsl(${hue} 70% 55%)`} strokeWidth={1} opacity={0.4} className="animate-pulse-amber" />
      )}
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={12}
        fill={fill}
        stroke={selected ? "hsl(var(--primary))" : stroke}
        strokeWidth={selected ? 2.5 : isActive ? 2 : 1.3}
        strokeDasharray={isQueued ? "5 3" : undefined}
      />
      {/* status dot */}
      <circle cx={x - w / 2 + 12} cy={y - h / 2 + 12} r={3.5} fill={isActive ? `hsl(${hue} 70% 55%)` : isDone ? "hsl(142 50% 45%)" : "hsl(var(--muted-foreground))"} />
      <text
        x={x}
        y={y - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="hsl(var(--foreground))"
        fontSize={12}
        fontWeight={500}
        style={{ textDecoration: isDone ? "line-through" : undefined }}
      >
        {title}
      </text>
      <text x={x} y={y + 13} textAnchor="middle" fontSize={8.5} fill="hsl(var(--muted-foreground))" style={{ fontFamily: "var(--mono-font)", letterSpacing: 0.5 }}>
        {node.kind}{node.horizon ? ` · ${node.horizon}` : ""}
      </text>
    </g>
  );
}

function EmptyState() {
  const [importOpen, setImportOpen] = useState(false);
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <p className="text-sm text-muted-foreground mb-4">
        아직 노드가 없습니다. 플라이휠을 시작하세요.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => seedLifeOS({ force: true })}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          예시(Life OS)로 시작
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors"
        >
          내 리포트 가져오기
        </button>
      </div>
      <ReportImport open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
