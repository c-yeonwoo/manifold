import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  upsertEdge,
  loadNodes,
  uid,
  EDGE_META,
  FLOW_KINDS,
  type EdgeType,
  type FlowKind,
} from "@/lib/manifold";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultSourceId?: string;
}

const selectClass =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

const EDGE_TYPES: EdgeType[] = ["feeds", "reinforces", "gates", "feedbacks"];

export default function EdgeForm({ open, onOpenChange, defaultSourceId }: Props) {
  const nodes = loadNodes();
  const [sourceId, setSourceId] = useState(defaultSourceId ?? nodes[0]?.id ?? "");
  const [targetId, setTargetId] = useState("");
  const [type, setType] = useState<EdgeType>("feeds");
  const [flow, setFlow] = useState<FlowKind | "">("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setSourceId(defaultSourceId ?? nodes[0]?.id ?? "");
    setTargetId("");
    setType("feeds");
    setFlow("");
    setLabel("");
  }, [open, defaultSourceId]);

  const submit = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    upsertEdge({
      id: uid(),
      sourceId,
      targetId,
      type,
      flow: flow || undefined,
      label: label.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>연결 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">출발 노드</label>
              <select className={selectClass} value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">도착 노드</label>
              <select className={selectClass} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">선택…</option>
                {nodes.filter((n) => n.id !== sourceId).map((n) => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">관계</label>
              <select className={selectClass} value={type} onChange={(e) => setType(e.target.value as EdgeType)}>
                {EDGE_TYPES.map((t) => (
                  <option key={t} value={t}>{EDGE_META[t].label} ({t})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">흐르는 것 (선택)</label>
              <select className={selectClass} value={flow} onChange={(e) => setFlow(e.target.value as FlowKind | "")}>
                <option value="">없음</option>
                {FLOW_KINDS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">라벨 (선택)</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="예: 현금흐름" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={submit} disabled={!targetId || sourceId === targetId}>추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
