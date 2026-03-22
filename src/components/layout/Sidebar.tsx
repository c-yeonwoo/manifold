import { useState, useEffect, useMemo } from "react";
import { loadJSON, saveJSON, getTodayKey, DEFAULT_ROUTINES, QUOTES, type RoutineItem } from "@/lib/store";

const PHASE_LABELS: Record<number, { label: string; time: string }> = {
  1: { label: "P1 Mind & Clean Up", time: "06:00–10:00" },
  2: { label: "P2 Work", time: "10:00–19:00" },
  3: { label: "P3 Work-out", time: "19:00–24:00" },
};

export default function Sidebar() {
  const todayKey = getTodayKey("routine");
  const [items, setItems] = useState<RoutineItem[]>(() =>
    loadJSON(todayKey, DEFAULT_ROUTINES)
  );

  useEffect(() => {
    saveJSON(todayKey, items);
    window.dispatchEvent(new Event("routine-updated"));
  }, [items, todayKey]);

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it))
    );
  };

  const quote = useMemo(() => {
    const idx = new Date().getDate() % QUOTES.length;
    return QUOTES[idx];
  }, []);

  const phases = [1, 2, 3] as const;

  return (
    <aside className="w-[220px] border-r border-border bg-sidebar h-full flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
      <div className="p-4 flex-1 stagger-children">
        {phases.map((phase) => {
          const phaseItems = items.filter((it) => it.phase === phase);
          const doneCount = phaseItems.filter((it) => it.done).length;
          const pct = phaseItems.length ? (doneCount / phaseItems.length) * 100 : 0;

          return (
            <div key={phase} className="mb-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
                  {PHASE_LABELS[phase].label}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {PHASE_LABELS[phase].time}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-secondary rounded-full mb-2.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="space-y-1">
                {phaseItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    className="flex items-center gap-2.5 w-full text-left py-1 group"
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                        item.done
                          ? "border-success bg-success/20"
                          : "border-muted-foreground/30 group-hover:border-primary"
                      }`}
                    >
                      {item.done && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="hsl(var(--success))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-[12px] transition-colors duration-150 ${
                        item.done ? "text-muted-foreground line-through" : "text-sidebar-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* Daily quote */}
      <div className="p-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
          "{quote}"
        </p>
      </div>
    </aside>
  );
}
