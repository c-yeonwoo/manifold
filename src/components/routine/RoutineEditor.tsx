import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles, Link as LinkIcon, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { publishNewVersion, type RoutineTemplateItem } from "@/lib/routines";
import { useRoutine, notifyRoutineTemplateChanged } from "@/lib/routine-context";
import VisionActionPicker, { type PickedAction } from "./VisionActionPicker";

interface DraftItem {
  tempId: string;
  label: string;
  goal_id: string | null;
  action_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoutineEditor({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { template, items, refresh } = useRoutine();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDrafts(
        items.map((it: RoutineTemplateItem) => ({
          tempId: it.id,
          label: it.label,
          goal_id: it.goal_id,
          action_id: it.action_id,
        }))
      );
    }
  }, [open, items]);

  const linkedKeys = new Set(
    drafts.filter((d) => d.goal_id && d.action_id).map((d) => `${d.goal_id}:${d.action_id}`)
  );

  const addCustom = () => {
    setDrafts((prev) => [
      ...prev,
      { tempId: `tmp-${Math.random().toString(36).slice(2)}`, label: "", goal_id: null, action_id: null },
    ]);
  };

  const handlePicks = (picks: PickedAction[]) => {
    setDrafts((prev) => [
      ...prev,
      ...picks.map((p) => ({
        tempId: `tmp-${Math.random().toString(36).slice(2)}`,
        label: `[${p.category}] ${p.actionLabel}`,
        goal_id: p.goalId,
        action_id: p.actionId,
      })),
    ]);
  };

  const update = (tempId: string, patch: Partial<DraftItem>) => {
    setDrafts((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, ...patch } : d)));
  };
  const remove = (tempId: string) => {
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  };
  const move = (tempId: string, dir: -1 | 1) => {
    setDrafts((prev) => {
      const idx = prev.findIndex((d) => d.tempId === tempId);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const save = async () => {
    if (!user || !template) return;
    const cleaned = drafts.filter((d) => d.label.trim().length > 0);
    if (cleaned.length === 0) {
      toast.error("최소 1개 이상의 항목이 필요합니다.");
      return;
    }
    setSaving(true);
    try {
      const newItems = cleaned.map((d, idx) => ({
        label: d.label.trim(),
        phase: 1, // legacy column kept; not used in UI
        position: idx,
        goal_id: d.goal_id,
        action_id: d.action_id,
      }));
      await publishNewVersion(user.id, template.version, newItems);
      toast.success(`루틴 v${template.version + 1} 적용됨`);
      notifyRoutineTemplateChanged();
      await refresh();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              루틴 편집
              {template && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  현재 v{template.version} → 저장 시 v{template.version + 1}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {drafts.length === 0 && (
              <p className="text-[12px] text-muted-foreground italic">
                항목이 없어요. 아래 버튼으로 추가해주세요.
              </p>
            )}
            {drafts.map((d, idx) => (
              <div key={d.tempId} className="flex items-center gap-1.5">
                <span className="w-6 text-[10px] font-mono text-muted-foreground text-right">
                  {idx + 1}.
                </span>
                {d.goal_id ? (
                  <LinkIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0" />
                )}
                <Input
                  value={d.label}
                  onChange={(e) => update(d.tempId, { label: e.target.value })}
                  placeholder="항목 이름"
                  className="text-[13px] h-8"
                />
                <button
                  onClick={() => move(d.tempId, -1)}
                  disabled={idx === 0}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(d.tempId, 1)}
                  disabled={idx === drafts.length - 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(d.tempId)}
                  className="p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={addCustom}
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-2"
            >
              <Plus className="w-3.5 h-3.5" /> 항목 추가
            </button>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setPickerOpen(true)}
              className="mr-auto"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Vision Board에서 가져오기
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "저장 중..." : "새 버전으로 저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VisionActionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={handlePicks}
        alreadyLinkedKeys={linkedKeys}
      />
    </>
  );
}
