import { Link } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { CATEGORIES, goalsByCategory, todayProgress } from "@/lib/goals";

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

export default function MandalaGrid() {
  useTick();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((c) => {
          const goals = goalsByCategory(c.key);
          // Sum today's progress across goals in this category
          let done = 0;
          let total = 0;
          goals.forEach((g) => {
            const p = todayProgress(g);
            done += p.done;
            total += p.total;
          });
          const pct = total ? Math.round((done / total) * 100) : 0;

          return (
            <Link
              key={c.key}
              to={`/category/${c.key}`}
              className="group relative rounded-xl border border-border bg-card/40 p-4 hover:border-primary/50 hover:bg-card transition-colors flex flex-col min-h-[180px]"
              style={{ borderLeftWidth: 3, borderLeftColor: `hsl(${c.hue} 50% 50%)` }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: `hsl(${c.hue} 60% 70%)` }}
                >
                  {c.label}
                </p>
                <span className="font-mono-num text-[10px] text-muted-foreground">
                  {done}/{total || 0}
                </span>
              </div>
              <p className="text-[13px] text-foreground/90 italic mb-3">"{c.mantra}"</p>

              <div className="flex-1 space-y-1">
                {goals.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground/60">목표 없음 · 클릭하여 추가</p>
                ) : (
                  goals.slice(0, 4).map((g) => {
                    const p = todayProgress(g);
                    const gpct = p.total ? (p.done / p.total) * 100 : 0;
                    return (
                      <div key={g.id} className="text-[12px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-foreground/80">{g.title}</span>
                          <span className="font-mono-num text-[10px] text-muted-foreground shrink-0">
                            {p.done}/{p.total}
                          </span>
                        </div>
                        <div className="h-[2px] bg-secondary rounded-full mt-0.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${gpct}%`,
                              background: `hsl(${c.hue} 60% 55%)`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
                {goals.length > 4 && (
                  <p className="text-[10px] text-muted-foreground">+{goals.length - 4} more</p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{goals.length} goals</span>
                <span className="font-mono-num" style={{ color: `hsl(${c.hue} 60% 65%)` }}>
                  {pct}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
