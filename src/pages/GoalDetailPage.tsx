import { useEffect, useState, useSyncExternalStore } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trophy, RotateCcw } from "lucide-react";
import {
  getCategory,
  getGoal,
  loadLog,
  saveLog,
  todayStr,
  listLogs,
  completeGoal,
  reopenGoal,
  type CategoryKey,
} from "@/lib/goals";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GoalForm from "@/components/goals/GoalForm";
import { toast } from "sonner";

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

export default function GoalDetailPage() {
  const { key, id } = useParams<{ key: string; id: string }>();
  useTick();
  const [edit, setEdit] = useState(false);
  const [note, setNote] = useState("");

  const meta = getCategory(key ?? "");
  const goal = id ? getGoal(id) : undefined;

  const today = todayStr();
  const log = goal ? loadLog(goal.id, today) : null;

  useEffect(() => {
    if (log) setNote(log.note);
  }, [log?.date, goal?.id]);

  if (!meta || !goal) return <Navigate to="/" />;

  const toggleAction = (aid: string) => {
    const cur = loadLog(goal.id, today);
    const has = cur.checkedActionIds.includes(aid);
    saveLog({
      ...cur,
      checkedActionIds: has ? cur.checkedActionIds.filter((x) => x !== aid) : [...cur.checkedActionIds, aid],
    });
  };

  const saveNote = () => {
    const cur = loadLog(goal.id, today);
    saveLog({ ...cur, note });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      saveNote();
    }
  };

  const logs = listLogs(goal.id);
  const totalChecks = logs.reduce((s, l) => s + l.checkedActionIds.length, 0);
  const activeDays = logs.filter((l) => l.checkedActionIds.length > 0).length;
  const startDays = Math.max(
    1,
    Math.floor((Date.now() - new Date(goal.createdAt).getTime()) / 86400000) + 1
  );

  // streak
  let streak = 0;
  const dset = new Set(logs.filter((l) => l.checkedActionIds.length > 0).map((l) => l.date));
  const d = new Date();
  while (true) {
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (dset.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }

  const todayDone = log?.checkedActionIds.length ?? 0;
  const todayPct = goal.actions.length ? (todayDone / goal.actions.length) * 100 : 0;
  const accent = `hsl(${meta.hue} 60% 60%)`;

  return (
    <div className="max-w-3xl animate-fade-up">
      <Link to={`/category/${meta.key}`} className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> {meta.label}
      </Link>

      {/* Vision */}
      <div
        className="rounded-xl border p-6 mb-6 relative overflow-hidden"
        style={{ borderColor: `hsl(${meta.hue} 30% 25%)`, background: `linear-gradient(135deg, hsl(${meta.hue} 30% 10%), hsl(var(--card)))` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: accent }}>
              {meta.label} · Vision
            </p>
            <h1 className="text-2xl font-medium mt-2">{goal.title}</h1>
            {goal.vision && (
              <p className="mt-3 text-lg italic text-foreground/90 leading-relaxed">"{goal.vision}"</p>
            )}
            {goal.deadline && (
              <p className="mt-3 text-[11px] text-muted-foreground font-mono-num">목표일 {goal.deadline}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEdit(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        {goal.imageUrl && (
          <img src={goal.imageUrl} alt="vision" className="mt-4 w-full max-h-56 object-cover rounded-lg opacity-90" />
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="오늘" value={`${todayDone}/${goal.actions.length}`} />
        <Stat label="연속" value={`${streak}일`} />
        <Stat label="활동일" value={`${activeDays}일`} />
        <Stat label="누적 체크" value={`${totalChecks}`} />
      </div>

      {/* Today actions */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wider" style={{ color: accent }}>
            오늘의 액션
          </h2>
          <span className="text-[11px] text-muted-foreground font-mono-num">{Math.round(todayPct)}%</span>
        </div>
        <div className="h-1 bg-secondary rounded-full mb-4 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${todayPct}%`, background: accent }} />
        </div>
        <div className="space-y-2">
          {goal.actions.length === 0 && (
            <p className="text-[12px] text-muted-foreground">아직 액션이 없어요. 우측 상단 편집 버튼으로 추가하세요.</p>
          )}
          {goal.actions.map((a) => {
            const checked = log?.checkedActionIds.includes(a.id) ?? false;
            return (
              <button
                key={a.id}
                onClick={() => toggleAction(a.id)}
                className="flex items-center gap-3 w-full text-left py-1.5 group"
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                    checked ? "bg-success/20" : "border-muted-foreground/30 group-hover:border-primary"
                  }`}
                  style={checked ? { borderColor: accent, background: `${accent}33` } : {}}
                >
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={`text-[13px] ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today note */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-[13px] font-medium uppercase tracking-wider mb-3" style={{ color: accent }}>
          오늘의 기록
        </h2>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={onKey}
          placeholder="오늘 무엇을 했고, 무엇을 느꼈나요? (Cmd+Enter 저장)"
          rows={4}
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={saveNote}>저장</Button>
        </div>
      </div>

      {/* Past logs */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-wider mb-3" style={{ color: accent }}>
          지난 기록
        </h2>
        <div className="space-y-3">
          {logs.filter((l) => l.date !== today && (l.note || l.checkedActionIds.length)).length === 0 && (
            <p className="text-[12px] text-muted-foreground">아직 기록이 없어요.</p>
          )}
          {logs
            .filter((l) => l.date !== today && (l.note || l.checkedActionIds.length))
            .map((l) => (
              <div key={l.date} className="border-l-2 pl-3" style={{ borderColor: `hsl(${meta.hue} 40% 35%)` }}>
                <div className="text-[11px] font-mono-num text-muted-foreground">
                  {l.date} · {l.checkedActionIds.length}/{goal.actions.length}
                </div>
                {l.note && <p className="text-[13px] text-foreground/90 mt-1 whitespace-pre-wrap">{l.note}</p>}
              </div>
            ))}
        </div>
      </div>

      <GoalForm open={edit} onOpenChange={setEdit} category={meta.key as CategoryKey} initial={goal} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-mono-num text-foreground mt-1">{value}</div>
    </div>
  );
}
