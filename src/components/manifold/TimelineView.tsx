import { useSyncExternalStore } from "react";
import { AlertTriangle } from "lucide-react";
import {
  loadNodes,
  loadEdges,
  getNode,
  getLayer,
  HORIZONS,
  type ManifoldNode,
} from "@/lib/manifold";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("manifold-updated", h);
      return () => window.removeEventListener("manifold-updated", h);
    },
    () => loadNodes().map((n) => n.horizon ?? "").join(",")
  );
}

const horizonIndex = (h?: string) => {
  const i = HORIZONS.indexOf((h ?? "TBD") as (typeof HORIZONS)[number]);
  return i < 0 ? HORIZONS.length : i;
};

export default function TimelineView() {
  useTick();
  const nodes = loadNodes().filter((n) => n.status !== "archived");
  const edges = loadEdges();

  // gate violations: a `gates` edge whose source is scheduled no earlier than its target
  const violations = edges
    .filter((e) => e.type === "gates")
    .map((e) => ({ src: getNode(e.sourceId), tgt: getNode(e.targetId), edge: e }))
    .filter((v) => v.src && v.tgt && horizonIndex(v.src!.horizon) >= horizonIndex(v.tgt!.horizon));

  const byHorizon = (h: string) => nodes.filter((n) => (n.horizon ?? "TBD") === h);

  return (
    <div className="max-w-5xl mx-auto">
      {violations.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[12px] font-medium mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> 순서 제약 경고
          </div>
          {violations.map((v) => (
            <p key={v.edge.id} className="text-[12px] text-muted-foreground">
              <span className="text-foreground/80">{v.src!.title}</span>({v.src!.horizon ?? "TBD"})가{" "}
              <span className="text-foreground/80">{v.tgt!.title}</span>({v.tgt!.horizon ?? "TBD"})보다 앞서야 합니다.
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {HORIZONS.map((h) => {
          const items = byHorizon(h);
          return (
            <div key={h} className="shrink-0 w-40">
              <div className="text-[11px] font-mono text-muted-foreground border-b border-border pb-1.5 mb-2 text-center uppercase tracking-wider">
                {h}
              </div>
              <div className="space-y-2 min-h-[80px]">
                {items.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground/40 text-center pt-3">—</p>
                ) : (
                  items.map((n) => <TimelineChip key={n.id} node={n} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineChip({ node }: { node: ManifoldNode }) {
  const hue = getLayer(node.layer)?.hue ?? 0;
  const active = node.status === "active";
  const done = node.status === "done";
  return (
    <div
      className="rounded-lg border bg-card/60 px-2.5 py-2"
      style={{
        borderColor: `hsl(${hue} 45% 55% / ${active ? 0.9 : 0.4})`,
        borderLeftWidth: 3,
        opacity: done ? 0.6 : 1,
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: active ? `hsl(${hue} 70% 55%)` : done ? "hsl(142 50% 45%)" : "hsl(var(--muted-foreground))" }}
        />
        <span className="text-[12px] text-foreground/90 truncate" style={{ textDecoration: done ? "line-through" : undefined }}>
          {node.title}
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground mt-0.5 ml-3" style={{ fontFamily: "var(--mono-font)" }}>
        {node.layer} · {node.kind}
      </p>
    </div>
  );
}
