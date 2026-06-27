import { useSyncExternalStore } from "react";
import { activeNodes, queuedNodes, loadNodes, loadEdges, LAYERS, ACTIVE_LIMIT } from "@/lib/manifold";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("manifold-updated", h);
      return () => window.removeEventListener("manifold-updated", h);
    },
    () => loadNodes().map((n) => n.status).join(",") + ":" + loadEdges().length
  );
}

export default function ActiveThreadsPanel({ onSelect }: { onSelect: (id: string) => void }) {
  useTick();
  const active = activeNodes();
  const queued = queuedNodes();
  const atCap = active.length >= ACTIVE_LIMIT;

  return (
    <div className="absolute left-2 top-2 z-10 w-52 rounded-lg border border-border bg-card/85 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Active threads</span>
        <span className={`font-mono-num text-[11px] ${atCap ? "text-primary" : "text-muted-foreground"}`}>
          {active.length}/{ACTIVE_LIMIT}
        </span>
      </div>

      <div className="space-y-1.5">
        {active.length === 0 && <p className="text-[11px] text-muted-foreground/60">진행 중인 스레드 없음</p>}
        {active.map((n) => {
          const hue = LAYERS.find((l) => l.key === n.layer)!.hue;
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className="w-full flex items-center gap-2 text-left rounded px-1.5 py-1 hover:bg-accent/60 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: `hsl(${hue} 70% 55%)` }} />
              <span className="text-[12px] text-foreground/90 truncate">{n.title}</span>
            </button>
          );
        })}
      </div>

      {queued.length > 0 && (
        <p className="mt-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
          큐 대기 {queued.length}개{atCap ? " · 슬롯 가득" : ""}
        </p>
      )}
    </div>
  );
}
