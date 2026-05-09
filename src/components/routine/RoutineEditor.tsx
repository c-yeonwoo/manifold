import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { publishNewVersion, type RoutineTemplateItem } from "@/lib/routines";
import { useRoutine, notifyRoutineTemplateChanged } from "@/lib/routine-context";
import { loadGoals, CATEGORIES } from "@/lib/goals";
import CategoryBadge from "./CategoryBadge";

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

  const goals = useMemo(() => (open ? loadGoals() : []), [open]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof goals>();
    goals.forEach((g) => {
      const arr = map.get(g.category) ?? [];
      arr.push(g);
      map.set(g.category, arr);
    });
    return map;
  }, [goals]);

  const linkedKeys = new Set(
    drafts.filter((d) => d.goal_id && d.action_id).map((d) => `${d.goal_id}:${d.action_id}`)
  );

  const addCustom = () => {
    setDrafts((prev) => [
      ...prev,
      { tempId: `tmp-${Math.random().toString(36).slice(2)}`, label: "", goal_id: null, action_id: null },
    ]);
  };

  const addFromVision = (
    goalId: string,
    actionId: string,
    actionLabel: string,
    categoryLabel: string
  ) => {
    const key = `${goalId}:${actionId}`;
    if (linkedKeys.has(key)) return;
    setDrafts((prev) => [
      ...prev,
      {
        tempId: `tmp-${Math.random().toString(36).slice(2)}`,
        label: actionLabel,
        goal_id: goalId,
        action_id: actionId,
      },
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
        phase: 1,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            루틴 편집
            {template && (
              <span className="text-[11px] text-muted-foreground font-mono">
                v{template.version} → 저장 시 v{template.version + 1}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_1fr] min-h-0">
          {/* LEFT: current routine drafts */}
          <div className="border-r border-border flex flex-col min-h-0">
            <div className="px-5 py-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
              내 루틴 ({drafts.length})
            </div>
            <ScrollArea className="flex-1">
              <div className="px-5 py-3 space-y-1.5">
                {drafts.length === 0 && (
                  <p className="text-[12px] text-muted-foreground italic py-6 text-center">
                    오른쪽에서 비전 보드 액션을 추가하거나, 아래 "항목 추가"를 눌러주세요.
                  </p>
                )}
                {drafts.map((d, idx) => (
                  <div key={d.tempId} className="flex items-center gap-1.5">
                    <span className="w-5 text-[11px] font-mono text-muted-foreground text-right">
                      {idx + 1}
                    </span>
                    <Input
                      value={d.label}
                      onChange={(e) => update(d.tempId, { label: e.target.value })}
                      placeholder="항목 이름"
                      className="text-[14px] h-9"
                    />
                    {d.goal_id && <CategoryBadge goalId={d.goal_id} size="sm" />}
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
            </ScrollArea>
          </div>

          {/* RIGHT: vision board picker */}
          <div className="flex flex-col min-h-0 bg-muted/20">
            <div className="px-5 py-3 text-[11px] uppercase tracking-wider text-primary/80 border-b border-border/60">
              Vision Board
            </div>
            <ScrollArea className="flex-1">
              <div className="px-5 py-3 space-y-5">
                {goals.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground italic py-8 text-center">
                    등록된 목표가 없어요.<br />비전 보드에서 먼저 목표를 추가해주세요.
                  </p>
                ) : (
                  CATEGORIES.map((cat) => {
                    const list = grouped.get(cat.key);
                    if (!list?.length) return null;
                    return (
                      <div key={cat.key}>
                        <div
                          className="text-[10px] uppercase tracking-wider mb-2 font-medium"
                          style={{ color: `hsl(${cat.hue} 60% 65%)` }}
                        >
                          {cat.label}
                        </div>
                        <div className="space-y-2.5">
                          {list.map((g) => (
                            <div key={g.id} className="rounded-md border border-border bg-background/50 p-2.5">
                              <div className="text-[12px] font-medium mb-1.5 truncate">{g.title}</div>
                              {g.actions.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground">액션 없음</p>
                              ) : (
                                <ul className="space-y-1">
                                  {g.actions.map((a) => {
                                    const key = `${g.id}:${a.id}`;
                                    const linked = linkedKeys.has(key);
                                    return (
                                      <li key={a.id}>
                                        <button
                                          type="button"
                                          disabled={linked}
                                          onClick={() => addFromVision(g.id, a.id, a.label, cat.label)}
                                          className={`w-full flex items-center gap-2 text-left text-[12px] px-2 py-1.5 rounded transition-colors ${
                                            linked
                                              ? "text-muted-foreground/50 cursor-not-allowed"
                                              : "hover:bg-primary/10 text-foreground"
                                          }`}
                                        >
                                          {linked ? (
                                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                                          ) : (
                                            <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                          )}
                                          <span className="flex-1 truncate">{a.label}</span>
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "저장 중..." : "새 버전으로 저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
