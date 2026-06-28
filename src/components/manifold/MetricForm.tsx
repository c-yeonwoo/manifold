import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import {
  upsertMetric,
  deleteMetric,
  loadNodes,
  loadMetrics,
  suggestMetricsFromNodes,
  uid,
  type Metric,
  type MetricKind,
} from "@/lib/manifold";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Metric;
}

const selectClass =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function MetricForm({ open, onOpenChange, initial }: Props) {
  const nodes = loadNodes();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [current, setCurrent] = useState("");
  const [kind, setKind] = useState<MetricKind>("milestone");
  const [nodeId, setNodeId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setLabel(initial?.label ?? "");
    setValue(initial?.value != null ? String(initial.value) : "");
    setUnit(initial?.unit ?? "");
    setCurrent(initial?.current != null ? String(initial.current) : "");
    setKind(initial?.kind ?? "milestone");
    setNodeId(initial?.nodeId ?? "");
  }, [open, initial]);

  // "system suggests" — numbers already mentioned in node text, not yet a metric
  const suggestions = useMemo(() => {
    if (!open) return [];
    const existing = new Set(loadMetrics().map((m) => `${m.value}__${m.unit}`));
    return suggestMetricsFromNodes().filter((s) => !existing.has(`${s.value}__${s.unit}`));
  }, [open]);

  const submit = () => {
    const v = parseFloat(value);
    if (!label.trim() || !isFinite(v)) return;
    const metric: Metric = {
      id: initial?.id ?? uid(),
      label: label.trim(),
      value: v,
      unit: unit.trim(),
      current: current.trim() ? parseFloat(current) : undefined,
      kind,
      nodeId: nodeId || undefined,
      position: initial?.position ?? loadMetrics().length,
    };
    upsertMetric(metric);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "목표 숫자 수정" : "측정가능한 목표"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!initial && suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5">
                <Sparkles className="w-3 h-3" /> 노드에서 발견한 숫자 — 눌러서 채우기
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.slice(0, 8).map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setLabel(s.label);
                      setValue(String(s.value));
                      setUnit(s.unit);
                      setNodeId(s.nodeId ?? "");
                    }}
                    className="text-[11px] px-2 py-1 rounded-full border border-border hover:border-primary/60 hover:text-primary transition-colors"
                  >
                    {s.value.toLocaleString()}{s.unit} · {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">라벨</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="월 수입 / 체중 / 결혼" autoFocus />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">목표 값</label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder="1000" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">단위</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="만원" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">현재 값 (선택)</label>
              <Input value={current} onChange={(e) => setCurrent(e.target.value)} inputMode="decimal" placeholder="진행도용" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">구분</label>
              <select className={selectClass} value={kind} onChange={(e) => setKind(e.target.value as MetricKind)}>
                <option value="milestone">마일스톤</option>
                <option value="final">최종 목표</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">연결 노드 (선택)</label>
            <select className={selectClass} value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
              <option value="">없음</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {initial ? (
            <Button
              variant="ghost"
              className="text-destructive/80 hover:text-destructive"
              onClick={() => {
                deleteMetric(initial.id);
                onOpenChange(false);
              }}
            >
              삭제
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
            <Button onClick={submit} disabled={!label.trim() || !isFinite(parseFloat(value))}>저장</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
