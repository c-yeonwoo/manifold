import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { upsertNode, uid, type ManifoldNode } from "@/lib/manifold";

interface Suggestion {
  label: string;
  kind: "daily" | "todo" | "goal";
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  node: ManifoldNode;
}

const KIND_LABEL: Record<Suggestion["kind"], string> = {
  daily: "매일",
  todo: "할 일",
  goal: "목표",
};
const KIND_TONE: Record<Suggestion["kind"], string> = {
  daily: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  todo: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  goal: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export default function SuggestActions({ open, onOpenChange, node }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const run = async () => {
    setLoading(true);
    setSuggestions([]);
    setPicked(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("manifold-suggest-actions", {
        body: {
          title: node.title,
          description: node.description,
          layer: node.layer,
          kind: node.kind,
          horizon: node.horizon,
          existing: node.actions.map((a) => a.label),
        },
      });
      if (error) throw error;
      const list = (data?.actions ?? []) as Suggestion[];
      if (!list.length) {
        toast.message("제안할 항목을 찾지 못했어요.");
      }
      setSuggestions(list);
      setPicked(new Set(list.map((_, i) => i)));
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (/402/.test(msg)) toast.error("AI 크레딧이 소진됐어요. 결제 후 다시 시도해 주세요.");
      else if (/429/.test(msg)) toast.error("요청이 잠시 많아요. 잠시 후 다시 시도해 주세요.");
      else toast.error("AI 제안 실패: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, node.id]);

  const toggle = (i: number) => {
    const next = new Set(picked);
    next.has(i) ? next.delete(i) : next.add(i);
    setPicked(next);
  };

  const apply = () => {
    const chosen = suggestions.filter((_, i) => picked.has(i));
    if (!chosen.length) {
      onOpenChange(false);
      return;
    }
    const existingLabels = new Set(node.actions.map((a) => a.label));
    const added = chosen.filter((s) => !existingLabels.has(s.label));
    upsertNode({
      ...node,
      actions: [
        ...node.actions,
        ...added.map((s) => ({ id: uid(), label: s.kind === "daily" ? s.label : `[${KIND_LABEL[s.kind]}] ${s.label}` })),
      ],
    });
    toast.success(`${added.length}개 추가됨`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" /> AI 액션 제안
          </DialogTitle>
        </DialogHeader>

        <p className="text-[12px] text-muted-foreground -mt-1">
          <span className="font-medium text-foreground/80">{node.title}</span> 노드에 어울리는 매일 습관·할 일·목표를 제안할게요.
        </p>

        <div className="min-h-[120px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> 제안 생성 중…
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-1.5">
              {suggestions.map((s, i) => {
                const on = picked.has(i);
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                      on ? "border-primary/60 bg-primary/5" : "border-border hover:bg-accent/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(i)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="text-[13px] flex-1 leading-snug">{s.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${KIND_TONE[s.kind]}`}>
                      {KIND_LABEL[s.kind]}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            취소
          </Button>
          <Button variant="secondary" onClick={run} disabled={loading}>
            다시 제안
          </Button>
          <Button onClick={apply} disabled={loading || suggestions.length === 0}>
            선택 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
