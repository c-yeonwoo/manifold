import { useNavigate } from "react-router-dom";
import { CATEGORIES, goalsByCategory, todayProgress, type CategoryMeta, type Goal } from "@/lib/goals";
import { useSyncExternalStore } from "react";

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

export default function MindmapCanvas() {
  useGoalsTick();
  const nav = useNavigate();

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
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-5xl mx-auto"
        style={{ minWidth: 720 }}
      >
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
            onClick={() => nav(`/category/${n.key}`)}
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
                onClick={() => nav(`/category/${n.key}/goal/${g.id}`)}
              />
            );
          })
        )}
      </svg>
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
