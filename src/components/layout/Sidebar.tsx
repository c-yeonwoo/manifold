import { useMemo, useSyncExternalStore } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { QUOTES } from "@/lib/store";
import { useMantra } from "@/lib/mantra-context";
import {
  activeNodes,
  loadNodes,
  loadNodeLog,
  toggleNodeAction,
  todayStr,
  LAYERS,
} from "@/lib/manifold";

function useManifoldTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("manifold-updated", h);
      return () => window.removeEventListener("manifold-updated", h);
    },
    () => loadNodes().map((n) => n.status).join(",")
  );
}

export default function Sidebar() {
  useManifoldTick();
  const today = todayStr();
  const actives = activeNodes().filter((n) => n.actions.length > 0);

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);

  let done = 0;
  let total = 0;
  actives.forEach((n) => {
    const log = loadNodeLog(n.id, today);
    total += n.actions.length;
    done += n.actions.filter((a) => log.checkedActionIds.includes(a.id)).length;
  });
  const pct = total ? (done / total) * 100 : 0;

  return (
    <aside className="w-[220px] border-r border-border bg-sidebar h-full flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
      <div className="p-4 flex-1">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[11px] font-medium text-primary uppercase tracking-wider">오늘의 체크인</span>
          <span className="text-[10px] font-mono text-muted-foreground">{done}/{total}</span>
        </div>
        <div className="h-1 bg-secondary rounded-full mb-3 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {actives.length === 0 ? (
          <Link to="/" className="text-[11px] text-primary/80 hover:text-primary">
            진행 중인 노드에 액션 추가 →
          </Link>
        ) : (
          <div className="space-y-3">
            {actives.map((n) => {
              const hue = LAYERS.find((l) => l.key === n.layer)!.hue;
              const log = loadNodeLog(n.id, today);
              return (
                <div key={n.id}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `hsl(${hue} 70% 55%)` }} />
                    <span className="text-[11px] text-muted-foreground truncate">{n.title}</span>
                  </div>
                  <div className="space-y-1 pl-3">
                    {n.actions.map((a) => {
                      const checked = log.checkedActionIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleNodeAction(n.id, a.id)}
                          className="flex items-center gap-2.5 w-full text-left py-0.5 group"
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                              checked ? "border-success bg-success/20" : "border-muted-foreground/30 group-hover:border-primary"
                            }`}
                          >
                            {checked && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="hsl(var(--success))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-[12px] leading-tight truncate ${checked ? "text-muted-foreground line-through" : "text-sidebar-foreground"}`}>
                            {a.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        <p className="text-[11px] text-muted-foreground italic leading-relaxed mb-2">"{fallbackQuote}"</p>
        <Link to="/mantra" className="text-[10px] text-primary/70 hover:text-primary inline-flex items-center gap-1">
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
      <p className="text-[11px] text-sidebar-foreground leading-relaxed">{todays.item.text}</p>
    </button>
  );
}
