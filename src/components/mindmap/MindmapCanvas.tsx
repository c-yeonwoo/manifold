import { useNavigate } from "react-router-dom";
import { CATEGORIES, goalsByCategory, todayProgress, type CategoryKey, type CategoryMeta, type Goal } from "@/lib/goals";
import { useSyncExternalStore, useRef, useState, useCallback, useEffect } from "react";
import { useTheme } from "@/lib/theme";

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
const GOAL_R = 140;

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

export default function MindmapCanvas() {
  useGoalsTick();
  const { theme } = useTheme();
  const isLight = theme === "light";
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

  // ----- Two-stage focus: 1st click zooms+centers, 2nd click navigates -----
  const [focusedKey, setFocusedKey] = useState<CategoryKey | null>(null);
  const animRef = useRef<number | null>(null);

  const cancelAnim = () => {
    if (animRef.current != null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };

  const animateView = (target: { x: number; y: number; scale: number }) => {
    cancelAnim();
    const start = { ...view };
    const t0 = performance.now();
    const dur = 380;
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      setView({
        x: start.x + (target.x - start.x) * e,
        y: start.y + (target.y - start.y) * e,
        scale: start.scale + (target.scale - start.scale) * e,
      });
      if (t < 1) animRef.current = requestAnimationFrame(step);
      else animRef.current = null;
    };
    animRef.current = requestAnimationFrame(step);
  };

  const focusOnCategory = (nx: number, ny: number) => {
    const targetScale = 1.8;
    animateView({
      x: CX - nx * targetScale,
      y: CY - ny * targetScale,
      scale: targetScale,
    });
  };

  const handleCategoryClick = (key: CategoryKey, nx: number, ny: number) => {
    if (panState.current.moved) return;
    if (focusedKey === key) {
      nav(`/category/${key}`);
      return;
    }
    setFocusedKey(key);
    focusOnCategory(nx, ny);
  };

  const clearFocus = () => {
    if (focusedKey == null) return;
    setFocusedKey(null);
    animateView({ x: 0, y: 0, scale: 1 });
  };

  // cancel running anim on user pan / wheel
  useEffect(() => {
    const sv = svgRef.current;
    if (!sv) return;
    const stop = () => cancelAnim();
    sv.addEventListener("pointerdown", stop);
    sv.addEventListener("wheel", stop);
    return () => {
      sv.removeEventListener("pointerdown", stop);
      sv.removeEventListener("wheel", stop);
    };
  }, []);

  const reset = () => {
    setFocusedKey(null);
    animateView({ x: 0, y: 0, scale: 1 });
  };
  const zoomBy = (factor: number) => {
    cancelAnim();
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
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="transparent"
          onClick={() => {
            if (panState.current.moved) return;
            clearFocus();
          }}
        />

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
            focused={focusedKey === n.key}
            dimmed={focusedKey != null && focusedKey !== n.key}
            isLight={isLight}
            onClick={() => handleCategoryClick(n.key, n.x, n.y)}
          />
        ))}

        {/* goal nodes */}
        {catNodes.map((n) =>
          n.goals.map((g, gi) => {
            const gp = goalPos(n, gi, n.goals.length);
            const p = todayProgress(g);
            const dimmed = focusedKey != null && focusedKey !== n.key;
            return (
              <GoalNode
                key={g.id}
                cx={gp.x}
                cy={gp.y}
                hue={n.hue}
                goal={g}
                done={p.done}
                total={p.total}
                dimmed={dimmed}
                onClick={() => guardedNav(`/category/${n.key}/goal/${g.id}`)}
              />
            );
          })
        )}
        </g>
      </svg>
      <p className="text-center text-[10px] text-muted-foreground mt-1">
        {focusedKey
          ? "한 번 더 클릭하면 상세 페이지로 · 빈 공간 클릭 시 닫힘"
          : "카테고리 클릭 → 포커스 · 한 번 더 클릭 → 상세"}
      </p>
    </div>
  );
}

function goalPos(n: { x: number; y: number; angle: number }, gi: number, total: number) {
  const spread = total === 1 ? 0 : (gi - (total - 1) / 2) * 0.5;
  const a = n.angle + spread;
  return {
    x: n.x + GOAL_R * Math.cos(a),
    y: n.y + GOAL_R * Math.sin(a),
  };
}

function CategoryNode({
  node,
  delay,
  focused,
  dimmed,
  isLight,
  onClick,
}: {
  node: CategoryMeta & { x: number; y: number; goals: Goal[] };
  delay: number;
  focused: boolean;
  dimmed: boolean;
  isLight: boolean;
  onClick: () => void;
}) {
  const fill = isLight ? `hsl(${node.hue} 55% 94%)` : `hsl(${node.hue} 30% 12%)`;
  const stroke = isLight
    ? `hsl(${node.hue} ${focused ? 60 : 45}% ${focused ? 50 : 60}%)`
    : `hsl(${node.hue} ${focused ? 70 : 50}% ${focused ? 65 : 55}%)`;
  const labelColor = isLight ? `hsl(${node.hue} 55% 32%)` : `hsl(${node.hue} 60% 75%)`;
  return (
    <g
      onClick={onClick}
      style={{
        cursor: "pointer",
        animation: `fade-up 0.5s ${delay}ms both`,
        opacity: dimmed ? 0.25 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      <circle
        cx={node.x}
        cy={node.y}
        r={42}
        fill={fill}
        stroke={stroke}
        strokeWidth={focused ? 2.5 : 1.5}
        style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
      />
      <text
        x={node.x}
        y={node.y - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={labelColor}
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
        {node.goals.length} goals
      </text>
      {focused && (
        <text
          x={node.x}
          y={node.y + 64}
          textAnchor="middle"
          fill="hsl(var(--primary))"
          fontSize={8}
          style={{ fontFamily: "var(--mono-font)", letterSpacing: 0.5 }}
        >
          ↳ 한 번 더 클릭 → 상세
        </text>
      )}
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
  dimmed,
  onClick,
}: {
  cx: number;
  cy: number;
  hue: number;
  goal: Goal;
  done: number;
  total: number;
  dimmed?: boolean;
  onClick: () => void;
}) {
  const pct = total ? done / total : 0;
  const r = 30;
  const c = 2 * Math.PI * r;
  // wrap title into up to 2 lines (~6 chars each)
  const max = 12;
  const t = goal.title.length > max ? goal.title.slice(0, max) + "…" : goal.title;
  const lines: string[] = [];
  if (t.length <= 6) {
    lines.push(t);
  } else {
    lines.push(t.slice(0, 6));
    lines.push(t.slice(6));
  }
  return (
    <g
      onClick={onClick}
      style={{
        cursor: "pointer",
        opacity: dimmed ? 0.2 : 1,
        transition: "opacity 0.3s ease",
      }}
      className="hover:opacity-90"
    >
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
      {/* title inside */}
      <text
        textAnchor="middle"
        fill="hsl(var(--foreground))"
        fontSize={10}
        fontWeight={500}
      >
        {lines.map((ln, i) => (
          <tspan
            key={i}
            x={cx}
            y={cy + (lines.length === 1 ? 3 : i === 0 ? -3 : 9)}
          >
            {ln}
          </tspan>
        ))}
      </text>
      {/* count subtitle below node */}
      <text
        x={cx}
        y={cy + r + 12}
        textAnchor="middle"
        fontSize={9}
        fill="hsl(var(--muted-foreground))"
        style={{ fontFamily: "var(--mono-font)" }}
      >
        {done}/{total}
      </text>
    </g>
  );
}
