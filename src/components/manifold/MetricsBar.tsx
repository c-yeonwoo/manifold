import { useState, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { loadMetrics, type Metric } from "@/lib/manifold";
import MetricForm from "./MetricForm";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("manifold-updated", h);
      return () => window.removeEventListener("manifold-updated", h);
    },
    () => loadMetrics().map((m) => `${m.id}:${m.value}:${m.current ?? ""}`).join(",")
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 1 }));

export default function MetricsBar() {
  useTick();
  const metrics = loadMetrics();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Metric | undefined>(undefined);

  const openNew = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (m: Metric) => { setEditing(m); setFormOpen(true); };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">목표 숫자</span>
        <span className="text-[10px] text-muted-foreground/60">측정가능한 마일스톤</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {metrics.map((m) => (
          <MetricCard key={m.id} metric={m} onClick={() => openEdit(m)} />
        ))}

        <button
          onClick={openNew}
          className="min-w-[88px] h-[78px] rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex flex-col items-center justify-center gap-1"
          aria-label="목표 숫자 추가"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px]">추가</span>
        </button>
      </div>

      <MetricForm open={formOpen} onOpenChange={setFormOpen} initial={editing} />
    </div>
  );
}

function MetricCard({ metric, onClick }: { metric: Metric; onClick: () => void }) {
  const isFinal = metric.kind === "final";
  const hasProgress = metric.current != null && metric.value !== 0;
  const pct = hasProgress ? Math.max(0, Math.min(100, (metric.current! / metric.value) * 100)) : 0;

  return (
    <button
      onClick={onClick}
      title={`${metric.label}: ${fmt(metric.value)}${metric.unit}${metric.current != null ? ` (현재 ${fmt(metric.current)}${metric.unit})` : ""} · ${isFinal ? "최종 목표" : "마일스톤"}`}
      className={`group relative min-w-[88px] h-[78px] rounded-xl border px-3 py-2 text-left transition-colors ${
        isFinal
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-card/50 hover:border-primary/40"
      }`}
      style={isFinal ? undefined : { borderTopColor: "hsl(var(--primary) / 0.5)", borderTopWidth: 2 }}
    >
      <div className="flex items-baseline gap-0.5">
        <span className="text-[26px] leading-none font-semibold font-mono-num text-foreground">{fmt(metric.value)}</span>
        {metric.unit && <span className="text-[11px] text-muted-foreground">{metric.unit}</span>}
      </div>
      <div className="mt-1.5 text-[11px] text-muted-foreground truncate">{metric.label}</div>

      {hasProgress && (
        <div className="absolute left-3 right-3 bottom-1.5 h-[2px] bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
      {isFinal && (
        <span className="absolute top-1.5 right-2 text-[8px] uppercase tracking-wider text-primary/70">최종</span>
      )}
    </button>
  );
}
