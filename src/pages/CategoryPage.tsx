import { useState, useSyncExternalStore } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { CATEGORIES, getCategory, goalsByCategory, todayProgress, deleteGoal, type CategoryKey } from "@/lib/goals";
import { Button } from "@/components/ui/button";
import GoalForm from "@/components/goals/GoalForm";
import { ArrowLeft, Trash2 } from "lucide-react";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("goals-updated", h);
      return () => window.removeEventListener("goals-updated", h);
    },
    () => localStorage.getItem("goals_v1") ?? ""
  );
}

export default function CategoryPage() {
  const { key } = useParams<{ key: string }>();
  useTick();
  const [open, setOpen] = useState(false);

  const meta = getCategory(key ?? "");
  if (!meta) return <Navigate to="/" />;

  const goals = goalsByCategory(meta.key as CategoryKey);
  const full = goals.length >= 3;

  return (
    <div className="max-w-3xl animate-fade-up">
      <Link to="/" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> 비전 보드로
      </Link>

      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: `hsl(${meta.hue} 60% 65%)` }}>
          {meta.label}
        </p>
        <h1 className="text-2xl font-medium mt-1">{meta.mantra}</h1>
        <p className="text-[12px] text-muted-foreground mt-1">최대 3개까지 목표를 세울 수 있어요. ({goals.length}/3)</p>
      </div>

      <div className="grid gap-3 stagger-children">
        {goals.map((g) => {
          const p = todayProgress(g);
          const pct = p.total ? (p.done / p.total) * 100 : 0;
          return (
            <Link
              key={g.id}
              to={`/category/${meta.key}/goal/${g.id}`}
              className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-foreground font-medium">{g.title}</h3>
                  {g.vision && <p className="text-[12px] text-muted-foreground mt-1 italic">"{g.vision}"</p>}
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-muted-foreground tracking-wider">오늘</div>
                  <div className="font-mono-num text-sm" style={{ color: `hsl(${meta.hue} 60% 70%)` }}>
                    {p.done}/{p.total}
                  </div>
                </div>
              </div>
              <div className="h-1 bg-secondary rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: `hsl(${meta.hue} 60% 55%)` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {g.deadline ? `~ ${g.deadline}` : "기한 없음"} · 액션 {g.actions.length}개
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("이 목표를 삭제할까요?")) deleteGoal(g.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          );
        })}

        <Button variant="secondary" disabled={full} onClick={() => setOpen(true)}>
          {full ? "목표 슬롯이 가득 찼어요 (3/3)" : "+ 새 목표 추가"}
        </Button>
      </div>

      <GoalForm open={open} onOpenChange={setOpen} category={meta.key as CategoryKey} />
    </div>
  );
}
