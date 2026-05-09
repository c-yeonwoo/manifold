import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Sparkles, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { publishNewVersion, type RoutineTemplateItem } from "@/lib/routines";
import { useRoutine, notifyRoutineTemplateChanged } from "@/lib/routine-context";
import VisionActionPicker, { type PickedAction } from "./VisionActionPicker";

interface DraftItem {
  tempId: string;
  label: string;
  phase: number;
  goal_id: string | null;
  action_id: string | null;
}

const PHASE_LABELS: Record<number, string> = {
  1: "P1 — Mind & Clean Up",
  2: "P2 — Work",
  3: "P3 — Work-out",
};

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

  // Hydrate drafts when opening
  useEffect(() => {
    if (open) {
      setDrafts(
        items.map((it: RoutineTemplateItem) => ({
          tempId: it.id,
          label: it.label,
          phase: it.phase,
          goal_id: it.goal_id,
          action_id: it.action_id,
        }))
      );
    }
  }, [open, items]);

  const linkedKeys = new Set(
    drafts.filter((d) => d.goal_id && d.action_id).map((d) => `${d.goal_id}:${d.action_id}`)
  );

  const addCustom = (phase: number) => {
    setDrafts((prev) => [
      ...prev,
      { tempId: `tmp-${Math.random().toString(36).slice(2)}`, label: "", phase, goal_id: null, action_id: null },
    ]);
  };

  const handlePicks = (picks: PickedAction[]) => {
    setDrafts((prev) => [
      ...prev,
      ...picks.map((p) => ({
        tempId: `tmp-${Math.random().toString(36).slice(2)}`,
        label: `[${p.category}] ${p.actionLabel}`,
        phase: 2,
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

  const movePhase = (tempId: string, phase: number) => update(tempId, { phase });

  const save = async () => {
    if (!user || !template) return;
    const cleaned = drafts.filter((d) => d.label.trim().length > 0);
    if (cleaned.length === 0) {
      toast.error("최소 1개 이상의 항목이 필요합니다.");
      return;
    }
    setSaving(true);
    try {
      // Compute positions per phase
      const byPhase: Record<number, DraftItem[]> = { 1: [], 2: [], 3: [] };
      cleaned.forEach((d) => byPhase[d.phase].push(d));
      const items = Object.entries(byPhase).flatMap(([phaseStr, list]) =>
        list.map((d, idx) => ({
          label: d.label.trim(),
          phase: Number(phaseStr),
          position: idx,
          goal_id: d.goal_id,
          action_id: d.action_id,
        }))
      );
      await publishNewVersion(user.id, template.version, items);
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

          <div className="space-y-5 py-2">
            {[1, 2, 3].map((phase) => {
              const list = drafts.filter((d) => d.phase === phase);
              return (
                <div key={phase} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-primary/80">
                      {PHASE_LABELS[phase]}
                    </span>
                    <button
                      onClick={() => addCustom(phase)}
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 항목 추가
                    </button>
                  </div>
                  {list.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic pl-1">비어있음</p>
                  )}
                  {list.map((d) => (
                    <div key={d.tempId} className="flex items-center gap-2">
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
                      <select
                        value={d.phase}
                        onChange={(e) => movePhase(d.tempId, Number(e.target.value))}
                        className="text-[11px] bg-secondary text-foreground rounded px-1.5 h-8 border border-border"
                      >
                        <option value={1}>P1</option>
                        <option value={2}>P2</option>
                        <option value={3}>P3</option>
                      </select>
                      <button
                        onClick={() => remove(d.tempId)}
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
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
