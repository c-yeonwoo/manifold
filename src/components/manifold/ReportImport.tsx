import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { parseReport, importReport } from "@/lib/manifold-import";
import { loadNodes } from "@/lib/manifold";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function ReportImport({ open, onOpenChange }: Props) {
  const [text, setText] = useState("");
  const [replace, setReplace] = useState(false);

  useEffect(() => {
    if (open) {
      setText("");
      setReplace(loadNodes().length > 0 ? false : false);
    }
  }, [open]);

  const preview = text.trim() ? parseReport(text) : null;

  const run = () => {
    if (!preview || preview.nodes.length === 0) {
      toast.error("가져올 노드를 찾지 못했습니다.");
      return;
    }
    const r = importReport(text, { replace });
    toast.success(`노드 ${r.nodes.length}개 · 연결 ${r.edges.length}개를 가져왔습니다.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>리포트 가져오기</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-[12px] text-muted-foreground">
            라이프플랜 리포트(마크다운)를 붙여넣으세요. <span className="font-mono">mermaid</span> flowchart의 레이어·노드·연결을 그래프로 가져옵니다.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            placeholder="# 🧭 Life OS …  (마크다운 리포트 전체를 붙여넣기)"
            className="font-mono text-[12px]"
          />

          {preview && (
            <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
              <p className="text-[12px]">
                미리보기: 노드 <span className="text-foreground font-medium">{preview.nodes.length}</span>개 · 연결{" "}
                <span className="text-foreground font-medium">{preview.edges.length}</span>개
              </p>
              {preview.warnings.length > 0 && (
                <div className="space-y-0.5">
                  {preview.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {w}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-[12px] text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            기존 그래프를 모두 지우고 교체 (체크 해제 시 추가)
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={run} disabled={!preview || preview.nodes.length === 0}>
            {replace ? "교체 가져오기" : "가져오기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
