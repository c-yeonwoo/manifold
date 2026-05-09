import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { QUOTES } from "@/lib/store";
import { useMantra } from "@/lib/mantra-context";
import { useRoutine } from "@/lib/routine-context";
import CategoryBadge from "@/components/routine/CategoryBadge";

export default function Sidebar() {
  const { items, checkedIds, toggle, loading } = useRoutine();

  const quote = useMemo(() => {
    const idx = new Date().getDate() % QUOTES.length;
    return QUOTES[idx];
  }, []);

  const doneCount = items.filter((it) => checkedIds.includes(it.id)).length;
  const pct = items.length ? (doneCount / items.length) * 100 : 0;

  return (
    <aside className="w-[220px] border-r border-border bg-sidebar h-full flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
      <div className="p-4 flex-1">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
            오늘의 루틴
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {doneCount}/{items.length}
          </span>
        </div>
        <div className="h-1 bg-secondary rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="space-y-1">
          {!loading && items.length === 0 && (
            <Link to="/routine" className="text-[11px] text-primary/80 hover:text-primary">
              루틴 만들기 →
            </Link>
          )}
          {items.map((item) => {
            const done = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item)}
                className="flex items-center gap-2.5 w-full text-left py-1 group"
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                    done
                      ? "border-success bg-success/20"
                      : "border-muted-foreground/30 group-hover:border-primary"
                  }`}
                >
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="hsl(var(--success))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-[13px] leading-tight transition-colors duration-150 inline-flex items-center gap-1.5 flex-1 min-w-0 ${
                    done ? "text-muted-foreground line-through" : "text-sidebar-foreground"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {item.goal_id && <CategoryBadge goalId={item.goal_id} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <DailyAffirmation fallbackQuote={quote} />
    </aside>
  );
}

function DailyAffirmation({ fallbackQuote }: { fallbackQuote: string }) {
  const { affirmations, openReader } = useMantra();
  const todays = useMemo(() => {
    if (affirmations.length === 0) return null;
    const idx = new Date().getDate() % affirmations.length;
    return { item: affirmations[idx], index: idx };
  }, [affirmations]);

  if (!todays) {
    return (
      <div className="p-4 border-t border-border">
        <p className="text-[11px] text-muted-foreground italic leading-relaxed mb-2">
          "{fallbackQuote}"
        </p>
        <Link
          to="/mantra"
          className="text-[10px] text-primary/70 hover:text-primary inline-flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" /> 내 확언 만들기 →
        </Link>
      </div>
    );
  }

  return (
    <button
      onClick={() => openReader(todays.index)}
      className="p-4 border-t border-border text-left hover:bg-card/40 transition-colors group"
    >
      <Sparkles className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors mb-1.5" />
      <p className="text-[11px] text-sidebar-foreground leading-relaxed">
        {todays.item.text}
      </p>
    </button>
  );
}
