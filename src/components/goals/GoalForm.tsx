import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { upsertGoal, uid, type Goal, type CategoryKey } from "@/lib/goals";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category: CategoryKey;
  initial?: Goal;
}

export default function GoalForm({ open, onOpenChange, category, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [vision, setVision] = useState(initial?.vision ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [actions, setActions] = useState<{ id: string; label: string }[]>(
    initial?.actions ?? [{ id: uid(), label: "" }]
  );

  const submit = () => {
    if (!title.trim()) return;
    const goal: Goal = {
      id: initial?.id ?? uid(),
      category,
      title: title.trim(),
      vision: vision.trim(),
      imageUrl: imageUrl.trim() || undefined,
      deadline: deadline || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      actions: actions.filter((a) => a.label.trim()).map((a) => ({ id: a.id, label: a.label.trim() })),
    };
    upsertGoal(goal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "목표 수정" : "새 목표"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 체지방 12%" />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">비전 (현재형 단언문)</label>
            <Textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="나는 매일 건강하게 운동하고 단단한 몸을 가지고 있다."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">기한 (선택)</label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">이미지 URL (선택)</label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">매일의 액션</label>
            <div className="space-y-2 mt-1">
              {actions.map((a, i) => (
                <div key={a.id} className="flex gap-2">
                  <Input
                    value={a.label}
                    onChange={(e) => {
                      const next = [...actions];
                      next[i] = { ...a, label: e.target.value };
                      setActions(next);
                    }}
                    placeholder={`액션 ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActions(actions.filter((x) => x.id !== a.id))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActions([...actions, { id: uid(), label: "" }])}
              >
                + 액션 추가
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={submit}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
