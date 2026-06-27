import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  upsertNode,
  uid,
  LAYERS,
  HORIZONS,
  NODE_KINDS,
  type ManifoldNode,
  type Layer,
  type NodeStatus,
} from "@/lib/manifold";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: ManifoldNode;
}

const selectClass =
  "w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export default function NodeForm({ open, onOpenChange, initial }: Props) {
  const [title, setTitle] = useState("");
  const [layer, setLayer] = useState<Layer>("base");
  const [kind, setKind] = useState<string>("goal");
  const [status, setStatus] = useState<NodeStatus>("queued");
  const [horizon, setHorizon] = useState<string>("now");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setLayer(initial?.layer ?? "base");
    setKind(initial?.kind ?? "goal");
    setStatus(initial?.status ?? "queued");
    setHorizon(initial?.horizon ?? "now");
    setDescription(initial?.description ?? "");
  }, [open, initial]);

  const submit = () => {
    if (!title.trim()) return;
    const node: ManifoldNode = {
      id: initial?.id ?? uid(),
      layer,
      kind,
      title: title.trim(),
      description: description.trim(),
      status,
      priority: initial?.priority ?? 0,
      x: initial?.x,
      y: initial?.y,
      horizon: horizon || undefined,
      targetDate: initial?.targetDate,
      category: initial?.category,
      vision: initial?.vision ?? "",
      imageUrl: initial?.imageUrl,
      actions: initial?.actions ?? [],
      meta: initial?.meta ?? {},
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      completedAt: initial?.completedAt,
    };
    upsertNode(node);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "노드 수정" : "새 노드"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">레이어</label>
              <select className={selectClass} value={layer} onChange={(e) => setLayer(e.target.value as Layer)}>
                {LAYERS.map((l) => (
                  <option key={l.key} value={l.key}>{l.label} · {l.key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">종류</label>
              <select className={selectClass} value={kind} onChange={(e) => setKind(e.target.value)}>
                {NODE_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">상태</label>
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as NodeStatus)}>
                <option value="queued">대기 (큐)</option>
                <option value="active">진행 중</option>
                <option value="done">완료</option>
                <option value="archived">보관</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">목표 시점</label>
              <select className={selectClass} value={horizon} onChange={(e) => setHorizon(e.target.value)}>
                {HORIZONS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">설명 (선택)</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={submit} disabled={!title.trim()}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
