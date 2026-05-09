import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Check, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { publishNewVersion, tomorrowStr, type RoutineTemplateItem } from "@/lib/routines";
import { useRoutine, notifyRoutineTemplateChanged } from "@/lib/routine-context";
import { loadGoals, CATEGORIES, todayStr } from "@/lib/goals";
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
  const { template, items, checkedIds, refresh } = useRoutine();
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

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const reorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setDrafts((prev) => {
      const from = prev.findIndex((d) => d.tempId === sourceId);
      const to = prev.findIndex((d) => d.tempId === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const [confirmOpen, setConfirmOpen] = useState(false);

  const performSave = async (mode: "today" | "tomorrow" | "reset") => {
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
      const effectiveFrom = mode === "tomorrow" ? tomorrowStr() : todayStr();
      const resetTodayLogForTemplateId = mode === "reset" ? template.id : undefined;
      await publishNewVersion(user.id, template.version, newItems, {
        effectiveFrom,
        resetTodayLogForTemplateId,
      });
      const versionLabel = `v${template.version + 1}`;
      const msg =
        mode === "tomorrow"
          ? `루틴 ${versionLabel} 내일부터 적용됩니다`
          : mode === "reset"
            ? `오늘 체크를 초기화하고 ${versionLabel}을 적용했어요`
            : `루틴 ${versionLabel} 적용됨`;
      toast.success(msg);
      notifyRoutineTemplateChanged();
      await refresh();
      setConfirmOpen(false);
      onOpenChange(false);
    } catch (err: any) {
      console.error("[routine] save failed", err);
      toast.error(`저장 실패: ${err?.message ?? "알 수 없는 오류"}`);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!user) {
      toast.error("로그인이 필요해요. 게스트 모드에서는 루틴을 저장할 수 없습니다.");
      return;
    }
    if (!template) {
      toast.error("루틴 템플릿을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (drafts.filter((d) => d.label.trim().length > 0).length === 0) {
      toast.error("최소 1개 이상의 항목이 필요합니다.");
      return;
    }
    // If today already has checked items, prompt the user.
    if (checkedIds.length > 0) {
      setConfirmOpen(true);
      return;
    }
    await performSave("today");
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
                  <div
                    key={d.tempId}
                    draggable
                    onDragStart={(e) => {
                      setDragId(d.tempId);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverId !== d.tempId) setDragOverId(d.tempId);
                    }}
                    onDragLeave={() => {
                      if (dragOverId === d.tempId) setDragOverId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId) reorder(dragId, d.tempId);
                      setDragId(null);
                      setDragOverId(null);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOverId(null);
                    }}
                    className={`flex items-center gap-1.5 rounded-md transition-colors ${
                      dragOverId === d.tempId && dragId !== d.tempId
                        ? "bg-primary/10 ring-1 ring-primary/40"
                        : ""
                    } ${dragId === d.tempId ? "opacity-50" : ""}`}
                  >
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                      aria-label="순서 변경"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                    <span className="w-5 text-[11px] font-mono text-muted-foreground text-right">
                      {idx + 1}
                    </span>
                    <Input
                      value={d.label}
                      onChange={(e) => update(d.tempId, { label: e.target.value })}
                      placeholder="항목 이름"
                      className="flex-1 min-w-0 text-[14px] h-9"
                    />
                    {d.goal_id && <CategoryBadge goalId={d.goal_id} size="sm" />}
                    <button
                      onClick={() => remove(d.tempId)}
                      className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"
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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>오늘 체크된 루틴이 있어요</AlertDialogTitle>
            <AlertDialogDescription>
              오늘 이미 {checkedIds.length}개 항목을 체크했습니다. 새 버전을 언제부터 적용할까요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={saving}>닫기</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => performSave("tomorrow")}
            >
              내일부터 적용
            </Button>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                performSave("reset");
              }}
            >
              오늘 초기화 후 즉시 적용
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
