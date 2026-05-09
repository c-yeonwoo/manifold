import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { loadGoals } from "@/lib/goals";
import { CATEGORIES } from "@/lib/goals";

export interface PickedAction {
  goalId: string;
  goalTitle: string;
  category: string;
  actionId: string;
  actionLabel: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (picks: PickedAction[]) => void;
  alreadyLinkedKeys: Set<string>; // `${goalId}:${actionId}`
}

export default function VisionActionPicker({ open, onOpenChange, onPick, alreadyLinkedKeys }: Props) {
  const goals = useMemo(() => loadGoals(), [open]);
  const [selected, setSelected] = useState<Record<string, PickedAction>>({});

  const toggle = (p: PickedAction) => {
    const key = `${p.goalId}:${p.actionId}`;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = p;
      return next;
    });
  };

  const submit = () => {
    onPick(Object.values(selected));
    setSelected({});
    onOpenChange(false);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof goals>();
    goals.forEach((g) => {
      const arr = map.get(g.category) ?? [];
      arr.push(g);
      map.set(g.category, arr);
    });
    return map;
  }, [goals]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Vision Board에서 가져오기</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-3">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              등록된 목표가 없어요. 비전 보드에서 먼저 목표를 추가해주세요.
            </p>
          ) : (
            <div className="space-y-5">
              {CATEGORIES.map((cat) => {
                const list = grouped.get(cat.key);
                if (!list?.length) return null;
                return (
                  <div key={cat.key}>
                    <div className="text-[11px] uppercase tracking-wider text-primary/80 mb-2">
                      {cat.label}
                    </div>
                    <div className="space-y-3">
                      {list.map((g) => (
                        <div key={g.id} className="rounded-md border border-border p-3">
                          <div className="text-sm font-medium mb-2">{g.title}</div>
                          {g.actions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">액션 없음</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {g.actions.map((a) => {
                                const key = `${g.id}:${a.id}`;
                                const linked = alreadyLinkedKeys.has(key);
                                const checked = !!selected[key];
                                return (
                                  <li key={a.id}>
                                    <label
                                      className={`flex items-start gap-2 text-[13px] cursor-pointer ${
                                        linked ? "opacity-40 pointer-events-none" : ""
                                      }`}
                                    >
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() =>
                                          toggle({
                                            goalId: g.id,
                                            goalTitle: g.title,
                                            category: cat.label,
                                            actionId: a.id,
                                            actionLabel: a.label,
                                          })
                                        }
                                      />
                                      <span>
                                        {a.label}
                                        {linked && <span className="ml-2 text-[10px] text-muted-foreground">이미 연결됨</span>}
                                      </span>
                                    </label>
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
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={submit} disabled={Object.keys(selected).length === 0}>
            {Object.keys(selected).length}개 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
