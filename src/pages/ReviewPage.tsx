import { useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import {
  loadGoals,
  CATEGORIES,
  quarterOf,
  quarterRange,
  quarterLabel,
  loadLifeVision,
  type Goal,
} from "@/lib/goals";
import { ArrowLeft, Trophy, Sprout, Flame, ChevronLeft, ChevronRight } from "lucide-react";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("goals-updated", h);
      return () => window.removeEventListener("goals-updated", h);
    },
    () => "v"
  );
}

function shiftQuarter(year: number, q: number, delta: number) {
  let nq = q + delta;
  let ny = year;
  while (nq > 4) {
    nq -= 4;
    ny += 1;
  }
  while (nq < 1) {
    nq += 4;
    ny -= 1;
  }
  return { year: ny, q: nq as 1 | 2 | 3 | 4 };
}

export default function ReviewPage() {
  useTick();
  const now = new Date();
  const cur = quarterOf(now);
  const [{ year, q }, setQ] = useState(cur);
  const { start, end } = quarterRange(year, q);
  const goals = loadGoals();
  const vision = loadLifeVision();

  const { completed, inProgress, started } = useMemo(() => {
    const completed: Goal[] = [];
    const inProgress: Goal[] = [];
    const started: Goal[] = [];
    for (const g of goals) {
      const created = new Date(g.createdAt);
      const done = g.completedAt ? new Date(g.completedAt) : null;
      if (done && done >= start && done < end) completed.push(g);
      if (created >= start && created < end) started.push(g);
      if (created < end && (!done || done >= end)) {
        if (!completed.includes(g)) inProgress.push(g);
      }
    }
    return { completed, inProgress, started };
  }, [goals, start, end]);

  const byCat = (list: Goal[], catKey: string) => list.filter((g) => g.category === catKey);

  return (
    <div className="max-w-3xl animate-fade-up">
      <Link to="/" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> 비전 보드로
      </Link>

      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Quarterly Review</p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => setQ(shiftQuarter(year, q, -1))}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-medium font-mono-num">{quarterLabel(year, q)}</h1>
          <button
            onClick={() => setQ(shiftQuarter(year, q, 1))}
            className="text-muted-foreground hover:text-foreground"
            disabled={year > cur.year || (year === cur.year && q >= cur.q)}
          >
            <ChevronRight className="w-5 h-5 disabled:opacity-30" />
          </button>
          {(year !== cur.year || q !== cur.q) && (
            <button
              onClick={() => setQ(cur)}
              className="text-[11px] text-muted-foreground hover:text-foreground ml-2"
            >
              이번 분기로
            </button>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1 font-mono-num">
          {start.toISOString().slice(0, 10)} → {new Date(end.getTime() - 1).toISOString().slice(0, 10)}
        </p>
        {vision && (
          <p className="mt-3 text-[13px] italic text-foreground/80 border-l-2 border-primary/60 pl-3">
            "{vision}"
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat icon={<Trophy className="w-4 h-4" />} label="달성" value={completed.length} hue={32} />
        <Stat icon={<Flame className="w-4 h-4" />} label="진행 중" value={inProgress.length} hue={210} />
        <Stat icon={<Sprout className="w-4 h-4" />} label="신규" value={started.length} hue={142} />
      </div>

      <Section title="달성한 목표" icon={<Trophy className="w-4 h-4" />} list={completed} byCat={byCat} empty="이번 분기에 달성한 목표가 아직 없어요." />
      <Section title="진행 중인 목표" icon={<Flame className="w-4 h-4" />} list={inProgress} byCat={byCat} empty="진행 중인 목표가 없어요." />
      <Section title="이번 분기에 시작한 목표" icon={<Sprout className="w-4 h-4" />} list={started} byCat={byCat} empty="새로 시작한 목표가 없어요." />
    </div>
  );
}

function Stat({ icon, label, value, hue }: { icon: React.ReactNode; label: string; value: number; hue: number }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span style={{ color: `hsl(${hue} 60% 65%)` }}>{icon}</span>
        {label}
      </div>
      <p className="font-mono-num text-3xl mt-2" style={{ color: `hsl(${hue} 60% 70%)` }}>
        {value}
      </p>
    </div>
  );
}

function Section({
  title,
  icon,
  list,
  byCat,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  list: Goal[];
  byCat: (l: Goal[], k: string) => Goal[];
  empty: string;
}) {
  return (
    <div className="mb-8">
      <h2 className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-muted-foreground mb-3">
        {icon} {title} <span className="font-mono-num">({list.length})</span>
      </h2>
      {list.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/60 italic">{empty}</p>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((c) => {
            const items = byCat(list, c.key);
            if (items.length === 0) return null;
            return (
              <div key={c.key}>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-1.5"
                  style={{ color: `hsl(${c.hue} 60% 70%)` }}
                >
                  {c.label}
                </p>
                <div className="grid gap-1.5">
                  {items.map((g) => (
                    <Link
                      key={g.id}
                      to={`/category/${g.category}/goal/${g.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card/30 px-3 py-2 hover:border-primary/40"
                      style={{ borderLeftWidth: 3, borderLeftColor: `hsl(${c.hue} 50% 50%)` }}
                    >
                      <span className="text-[13px] text-foreground/90 truncate">{g.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono-num shrink-0">
                        {g.completedAt
                          ? `달성 ${g.completedAt.slice(0, 10)}`
                          : g.createdAt.slice(0, 10)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
