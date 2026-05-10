import { useState, useSyncExternalStore } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  getCategory,
  activeGoalsByCategory,
  completedGoalsByCategory,
  todayProgress,
  deleteGoal,
  reopenGoal,
  type CategoryKey,
  type Goal,
} from "@/lib/goals";
import { Button } from "@/components/ui/button";
import GoalForm from "@/components/goals/GoalForm";
import { ArrowLeft, Trash2, Trophy, RotateCcw } from "lucide-react";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("goals-updated", h);
      return () => window.removeEventListener("goals-updated", h);
    },
    () => Date.now().toString()
  );
}

const SLOT_LIMIT = 3;

export default function CategoryPage() {
  const { key } = useParams<{ key: string }>();
  useTick();
  const [open, setOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const meta = getCategory(key ?? "");
  if (!meta) return <Navigate to="/" />;

  const active = activeGoalsByCategory(meta.key as CategoryKey);
  const completed = completedGoalsByCategory(meta.key as CategoryKey);
  const full = active.length >= SLOT_LIMIT;

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
        <p className="text-[12px] text-muted-foreground mt-1">
          진행 중인 목표 {active.length}/{SLOT_LIMIT} · 달성 {completed.length}
        </p>
      </div>

      <div className="grid gap-3 stagger-children">
        {active.map((g) => {
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
          {full ? `목표 슬롯이 가득 찼어요 (${SLOT_LIMIT}/${SLOT_LIMIT})` : "+ 새 목표 추가"}
        </Button>
      </div>

      {/* ─── 달성한 목표 ─── */}
      {completed.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground mb-3"
          >
            <Trophy className="w-3.5 h-3.5" style={{ color: `hsl(${meta.hue} 60% 65%)` }} />
            달성한 목표 ({completed.length})
            <span className="text-[10px]">{showCompleted ? "▾" : "▸"}</span>
          </button>
          {showCompleted && (
            <div className="grid gap-2">
              {completed.map((g) => (
                <CompletedGoalRow key={g.id} g={g} hue={meta.hue} catKey={meta.key as CategoryKey} />
              ))}
            </div>
          )}
        </div>
      )}

      <GoalForm open={open} onOpenChange={setOpen} category={meta.key as CategoryKey} />
    </div>
  );
}

function CompletedGoalRow({ g, hue, catKey }: { g: Goal; hue: number; catKey: CategoryKey }) {
  const start = g.createdAt.slice(0, 10);
  const end = (g.completedAt ?? "").slice(0, 10);
  const days = Math.max(
    1,
    Math.round((new Date(g.completedAt!).getTime() - new Date(g.createdAt).getTime()) / 86400000)
  );
  return (
    <div
      className="rounded-md border border-border/60 bg-card/40 px-4 py-3 flex items-center gap-3 group"
      style={{ borderLeftWidth: 3, borderLeftColor: `hsl(${hue} 50% 50%)` }}
    >
      <Trophy className="w-4 h-4 shrink-0" style={{ color: `hsl(${hue} 60% 65%)` }} />
      <div className="flex-1 min-w-0">
        <Link
          to={`/category/${catKey}/goal/${g.id}`}
          className="text-[14px] font-medium text-foreground/90 hover:text-primary truncate block"
        >
          {g.title}
        </Link>
        <div className="text-[10px] text-muted-foreground font-mono-num mt-0.5">
          {start} → {end} · {days}일
        </div>
      </div>
      <button
        onClick={() => {
          if (confirm("이 목표를 다시 진행 중으로 되돌릴까요?")) reopenGoal(g.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
        title="다시 열기"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => {
          if (confirm("이 달성 기록을 영구 삭제할까요?")) deleteGoal(g.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        title="삭제"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
