import { useState } from "react";
import { X, Pencil, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  setNodeStatus,
  deleteNode,
  deleteEdge,
  canActivate,
  unmetGates,
  edgesFrom,
  edgesTo,
  getNode,
  getLayer,
  loadNodeLog,
  toggleNodeAction,
  todayNodeProgress,
  todayStr,
  EDGE_META,
  type ManifoldNode,
  type NodeStatus,
} from "@/lib/manifold";
import NodeForm from "./NodeForm";
import EdgeForm from "./EdgeForm";

const STATUS_LABEL: Record<NodeStatus, string> = {
  active: "진행 중",
  queued: "대기",
  done: "완료",
  archived: "보관",
};

export default function NodeDetail({ node, onClose }: { node: ManifoldNode; onClose: () => void }) {
  const layer = getLayer(node.layer);
  const hue = layer?.hue ?? 0;
  const [editOpen, setEditOpen] = useState(false);
  const [edgeOpen, setEdgeOpen] = useState(false);

  const promote = () => {
    const blockers = unmetGates(node.id);
    if (blockers.length > 0) {
      toast.error(`선행 노드 미완료: ${blockers.map((b) => b.title).join(", ")}`);
      return;
    }
    if (!canActivate()) {
      toast.error("동시 진행은 3개까지. 다른 스레드를 먼저 큐로 내리세요.");
      return;
    }
    setNodeStatus(node.id, "active");
  };

  const outFlows = edgesFrom(node.id);
  const inFlows = edgesTo(node.id);
  const today = todayStr();
  const log = loadNodeLog(node.id, today);
  const prog = todayNodeProgress(node);

  return (
    <div className="absolute right-2 bottom-2 z-20 w-72 rounded-xl border border-border bg-card shadow-lg p-4" style={{ borderTopColor: `hsl(${hue} 60% 55%)`, borderTopWidth: 3 }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em]" style={{ color: `hsl(${hue} 55% 60%)` }}>
            {layer?.label} · {node.kind}
          </p>
          <h3 className="text-sm font-medium leading-tight">{node.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => setEditOpen(true)} className="text-muted-foreground hover:text-foreground" aria-label="수정" title="수정">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEdgeOpen(true)} className="text-muted-foreground hover:text-foreground" aria-label="연결 추가" title="연결 추가">
            <Link2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="닫기">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {node.description && <p className="text-[12px] text-muted-foreground mt-1 mb-2 leading-snug">{node.description}</p>}

      {node.horizon && (
        <p className="text-[11px] font-mono text-muted-foreground mb-3">목표 시점: <span className="text-foreground/80">{node.horizon}</span></p>
      )}

      {/* status controls */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={promote}
          disabled={node.status === "active"}
          className="flex-1 px-2 py-1.5 rounded text-[11px] border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          진행
        </button>
        <button
          onClick={() => setNodeStatus(node.id, "queued")}
          disabled={node.status === "queued"}
          className="flex-1 px-2 py-1.5 rounded text-[11px] border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          큐로
        </button>
        <button
          onClick={() => setNodeStatus(node.id, "done")}
          disabled={node.status === "done"}
          className="flex-1 px-2 py-1.5 rounded text-[11px] border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          완료
        </button>
      </div>

      {/* today's check-in */}
      {node.actions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">오늘의 체크인</span>
            <span className="font-mono-num text-[10px] text-muted-foreground">{prog.done}/{prog.total}</span>
          </div>
          <div className="space-y-1">
            {node.actions.map((a) => {
              const checked = log.checkedActionIds.includes(a.id);
              return (
                <label key={a.id} className="flex items-center gap-2 text-[12px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNodeAction(node.id, a.id)}
                    className="accent-primary"
                  />
                  <span className={checked ? "text-muted-foreground line-through" : "text-foreground/90"}>{a.label}</span>
                </label>
              );
            })}
          </div>
          <div className="h-[3px] bg-secondary rounded-full mt-2 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${prog.total ? (prog.done / prog.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* flows */}
      {(outFlows.length > 0 || inFlows.length > 0) && (
        <div className="space-y-1 mb-3 text-[11px]">
          {inFlows.map((e) => {
            const src = getNode(e.sourceId);
            return (
              <div key={e.id} className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-foreground/70 truncate">{src?.title ?? "?"}</span>
                <span className="text-[9px] opacity-60">[{EDGE_META[e.type].label}{e.label ? ` · ${e.label}` : ""}]</span>
                <span>→ 나</span>
              </div>
            );
          })}
          {outFlows.map((e) => {
            const tgt = getNode(e.targetId);
            return (
              <div key={e.id} className="group flex items-center gap-1.5 text-muted-foreground">
                <span>나 →</span>
                <span className="text-[9px] opacity-60">[{EDGE_META[e.type].label}{e.label ? ` · ${e.label}` : ""}]</span>
                <span className="text-foreground/70 truncate">{tgt?.title ?? "?"}</span>
                <button onClick={() => deleteEdge(e.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-destructive/70 hover:text-destructive" aria-label="연결 삭제">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">상태: {STATUS_LABEL[node.status]}</span>
        <button
          onClick={() => {
            if (confirm(`"${node.title}" 노드를 삭제할까요?`)) {
              deleteNode(node.id);
              onClose();
            }
          }}
          className="text-[10px] text-destructive/80 hover:text-destructive"
        >
          삭제
        </button>
      </div>

      <NodeForm open={editOpen} onOpenChange={setEditOpen} initial={node} />
      <EdgeForm open={edgeOpen} onOpenChange={setEdgeOpen} defaultSourceId={node.id} />
    </div>
  );
}
