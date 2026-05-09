import { useNavigate } from "react-router-dom";
import { CATEGORIES, goalsByCategory, todayProgress, type CategoryMeta, type Goal } from "@/lib/goals";
import { useSyncExternalStore, useRef, useState, useCallback, useEffect } from "react";

function useGoalsTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("goals-updated", h);
      window.addEventListener("storage", h);
      return () => {
        window.removeEventListener("goals-updated", h);
        window.removeEventListener("storage", h);
      };
    },
    () => localStorage.getItem("goals_v1") ?? ""
  );
}

const W = 960;
const H = 640;
const CX = W / 2;
const CY = H / 2;
const CAT_R = 230;
const GOAL_R = 110;

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

export default function MindmapCanvas() {
  useGoalsTick();
  const nav = useNavigate();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const panState = useRef<{ active: boolean; moved: boolean; startX: number; startY: number; origX: number; origY: number }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = (clientX - rect.left) * (W / rect.width);
    const sy = (clientY - rect.top) * (H / rect.height);
    return { x: sx, y: sy };
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const { x: mx, y: my } = clientToSvg(e.clientX, e.clientY);
      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
        // keep mouse point stable
        const k = newScale / v.scale;
        const nx = mx - k * (mx - v.x);
        const ny = my - k * (my - v.y);
        return { x: nx, y: ny, scale: newScale };
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

  const guardedNav = (to: string) => {
    if (panState.current.moved) return;
    nav(to);
  };

  const reset = () => setView({ x: 0, y: 0, scale: 1 });
  const zoomBy = (factor: number) => {
    setView((v) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale * factor));
      const k = newScale / v.scale;
      const cx = W / 2;
      const cy = H / 2;
      const nx = cx - k * (cx - v.x);
      const ny = cy - k * (cy - v.y);
      return { x: nx, y: ny, scale: newScale };
    });
  };

  const catNodes = CATEGORIES.map((c, i) => {
    const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / CATEGORIES.length;
    return {
      ...c,
      x: CX + CAT_R * Math.cos(angle),
      y: CY + CAT_R * Math.sin(angle),
      angle,
      goals: goalsByCategory(c.key),
    };
  });

  return (
    <div className="w-full relative">
      {/* zoom controls */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
        <button
          onClick={() => zoomBy(1.2)}
          className="w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground text-sm"
          aria-label="zoom in"
        >
          +
        </button>
        <button
          onClick={() => zoomBy(1 / 1.2)}
          className="w-8 h-8 rounded-md bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground text-sm"
          aria-label="zoom out"
        >
          −
        </button>
        <button
          onClick={reset}
          className="w-8 h-8 rounded-md bg-card border border-border text-muted-foreground hover:text-foreground text-[10px]"
          aria-label="reset"
          title="원위치"
        >
          ⟳
        </button>
      </div>

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
        {/* invisible background so empty space catches drags */}
        <rect x={0} y={0} width={W} height={H} fill="transparent" />

        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {/* edges from center to category */}
        {catNodes.map((n) => (
          <line
            key={`e-${n.key}`}
            x1={CX}
            y1={CY}
            x2={n.x}
            y2={n.y}
            stroke={`hsl(${n.hue} 40% 40% / 0.5)`}
            strokeWidth={1.5}
          />
        ))}

        {/* edges from category to goals */}
        {catNodes.map((n) =>
          n.goals.map((g, gi) => {
            const gp = goalPos(n, gi, n.goals.length);
            return (
              <line
                key={`ge-${g.id}`}
                x1={n.x}
                y1={n.y}
                x2={gp.x}
                y2={gp.y}
                stroke={`hsl(${n.hue} 40% 35% / 0.6)`}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            );
          })
        )}

        {/* center "나" */}
        <g>
          <circle
            cx={CX}
            cy={CY}
            r={56}
            fill="hsl(var(--card))"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            className="animate-pulse-amber"
          />
          <text
            x={CX}
            y={CY + 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="hsl(var(--primary))"
            fontSize={28}
            fontWeight={500}
            style={{ fontFamily: "var(--body-font)" }}
          >
            나
          </text>
          <text
            x={CX}
            y={CY + 28}
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
            fontSize={9}
            style={{ fontFamily: "var(--mono-font)", letterSpacing: 1 }}
          >
            I AM
          </text>
        </g>

        {/* category nodes */}
        {catNodes.map((n, i) => (
          <CategoryNode
            key={n.key}
            node={n}
            delay={i * 80}
            onClick={() => guardedNav(`/category/${n.key}`)}
          />
        ))}

        {/* goal nodes */}
        {catNodes.map((n) =>
          n.goals.map((g, gi) => {
            const gp = goalPos(n, gi, n.goals.length);
            const p = todayProgress(g);
            return (
              <GoalNode
                key={g.id}
                cx={gp.x}
                cy={gp.y}
                hue={n.hue}
                goal={g}
                done={p.done}
                total={p.total}
                onClick={() => guardedNav(`/category/${n.key}/goal/${g.id}`)}
              />
            );
          })
        )}
        </g>
      </svg>
      <p className="text-center text-[10px] text-muted-foreground mt-1">
        드래그로 이동 · 휠 또는 +/− 버튼으로 확대/축소
      </p>
    </div>
  );
}

function goalPos(n: { x: number; y: number; angle: number }, gi: number, total: number) {
  const spread = total === 1 ? 0 : (gi - (total - 1) / 2) * 0.42;
  const a = n.angle + spread;
  return {
    x: n.x + GOAL_R * Math.cos(a),
    y: n.y + GOAL_R * Math.sin(a),
  };
}

function CategoryNode({
  node,
  delay,
  onClick,
}: {
  node: CategoryMeta & { x: number; y: number; goals: Goal[] };
  delay: number;
  onClick: () => void;
}) {
  return (
    <g
      onClick={onClick}
      style={{ cursor: "pointer", animation: `fade-up 0.5s ${delay}ms both` }}
      className="hover:opacity-90 transition-opacity"
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={42}
        fill={`hsl(${node.hue} 30% 12%)`}
        stroke={`hsl(${node.hue} 50% 55%)`}
        strokeWidth={1.5}
      />
      <text
        x={node.x}
        y={node.y - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={`hsl(${node.hue} 60% 75%)`}
        fontSize={14}
        fontWeight={500}
        style={{ fontFamily: "var(--mono-font)" }}
      >
        {node.label}
      </text>
      <text
        x={node.x}
        y={node.y + 16}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={9}
      >
        {node.goals.length}/3
      </text>
    </g>
  );
}

function GoalNode({
  cx,
  cy,
  hue,
  goal,
  done,
  total,
  onClick,
}: {
  cx: number;
  cy: number;
  hue: number;
  goal: Goal;
  done: number;
  total: number;
  onClick: () => void;
}) {
  const pct = total ? done / total : 0;
  const r = 22;
  const c = 2 * Math.PI * r;
  const label = goal.title.length > 8 ? goal.title.slice(0, 8) + "…" : goal.title;
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} className="hover:opacity-90">
      <circle cx={cx} cy={cy} r={r} fill="hsl(var(--card))" stroke={`hsl(${hue} 40% 30%)`} strokeWidth={1} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={`hsl(${hue} 60% 55%)`}
        strokeWidth={2}
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy + 38}
        textAnchor="middle"
        fill="hsl(var(--foreground))"
        fontSize={11}
      >
        {label}
      </text>
      <text x={cx} y={cy + 3} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="hsl(var(--muted-foreground))" style={{ fontFamily: "var(--mono-font)" }}>
        {done}/{total}
      </text>
    </g>
  );
}
