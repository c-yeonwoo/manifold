import { useEffect, useMemo, useState } from "react";
import { Pencil, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoutine } from "@/lib/routine-context";
import { useAuth } from "@/lib/auth";
import { listLogs, type RoutineTemplateItem } from "@/lib/routines";
import RoutineEditor from "@/components/routine/RoutineEditor";

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const PHASE_LABELS: Record<number, string> = {
  1: "P1 — Mind & Clean Up",
  2: "P2 — Work",
  3: "P3 — Work-out",
};

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getDaysInYear(year: number) {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function getRateColor(rate: number): string {
  if (rate === 0) return "bg-secondary";
  if (rate < 0.3) return "bg-[hsl(142_50%_20%)]";
  if (rate < 0.6) return "bg-[hsl(142_50%_30%)]";
  if (rate < 0.9) return "bg-[hsl(142_50%_38%)]";
  return "bg-[hsl(142_50%_45%)]";
}

export default function RoutinePage() {
  const { user } = useAuth();
  const { items, checkedIds, toggle, template } = useRoutine();
  const [editorOpen, setEditorOpen] = useState(false);
  const [logsByDate, setLogsByDate] = useState<Record<string, { count: number }>>({});

  const year = new Date().getFullYear();
  const today = new Date();

  // Items count for today's template (used as denominator for today's cell)
  const itemCount = items.length;

  useEffect(() => {
    if (!user) return;
    listLogs(user.id, `${year}-01-01`, `${year}-12-31`).then((rows) => {
      const map: Record<string, { count: number }> = {};
      rows.forEach((r) => {
        const ids = (r.checked_item_ids ?? []) as string[];
        map[r.log_date] = { count: ids.length };
      });
      setLogsByDate(map);
    });
  }, [user, year, checkedIds]);

  const days = useMemo(() => getDaysInYear(year), [year]);

  const heatmapData = useMemo(() => {
    return days.map((d) => {
      const isFuture = d > today;
      const isToday = d.toDateString() === today.toDateString();
      const key = isoDate(d);
      const logCount = logsByDate[key]?.count ?? 0;
      // Use today's denominator for any day; rough approximation since templates change.
      const denom = itemCount || 1;
      const rate = isFuture ? -1 : Math.min(1, logCount / denom);
      return { date: d, rate, isFuture, isToday };
    });
  }, [days, today, logsByDate, itemCount]);

  const weeks: typeof heatmapData[number][][] = [];
  let currentWeek: typeof heatmapData[number][] = [];
  const firstDayOfWeek = days[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++)
    currentWeek.push({ date: new Date(0), rate: -1, isFuture: true, isToday: false });
  heatmapData.forEach((d) => {
    currentWeek.push(d);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  });
  if (currentWeek.length) {
    while (currentWeek.length < 7) currentWeek.push({ date: new Date(0), rate: -1, isFuture: true, isToday: false });
    weeks.push(currentWeek);
  }

  const monthPositions = useMemo(() => {
    const pos: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const validDay = week.find((d) => d.date.getFullYear() === year);
      if (validDay && validDay.date.getMonth() !== lastMonth) {
        lastMonth = validDay.date.getMonth();
        pos.push({ label: MONTHS[lastMonth], col: wi });
      }
    });
    return pos;
  }, [weeks, year]);

  const doneCount = checkedIds.length;
  const todayPct = itemCount ? Math.round((doneCount / itemCount) * 100) : 0;

  return (
    <div className="max-w-5xl animate-fade-up">
      {/* Today's checklist */}
      <div className="bg-card rounded-lg border border-border p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-medium text-foreground">오늘의 루틴</h2>
            {template && (
              <span className="text-[10px] font-mono text-muted-foreground">
                v{template.version} · {template.effective_from} 부터 적용
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditorOpen(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> 루틴 편집
          </Button>
        </div>

        <div className="h-1 bg-secondary rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${todayPct}%` }}
          />
        </div>

        <div className="space-y-1.5">
          {items.length === 0 && (
            <p className="text-[12px] text-muted-foreground italic">
              아직 루틴이 없어요. 우상단 "루틴 편집"을 눌러 시작해보세요.
            </p>
          )}
          {items.map((item: RoutineTemplateItem) => {
            const done = checkedIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item)}
                className="flex items-start gap-2.5 w-full text-left py-1 group"
              >
                <span
                  className={`w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                    done
                      ? "border-success bg-success/20"
                      : "border-muted-foreground/30 group-hover:border-primary"
                  }`}
                >
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="hsl(var(--success))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-[13px] leading-snug inline-flex items-center gap-1 ${
                    done ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {item.goal_id && <Link2 className="w-3 h-3 text-primary/70 shrink-0" />}
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        <div className="bg-card rounded-lg p-4 border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">오늘 달성률</span>
          <span className="text-2xl font-mono font-medium text-foreground">{todayPct}%</span>
          <span className="text-[12px] text-muted-foreground ml-2">{doneCount}/{itemCount}</span>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">기록된 일수</span>
          <span className="text-2xl font-mono font-medium text-foreground">{Object.keys(logsByDate).length}</span>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">현재 버전</span>
          <span className="text-2xl font-mono font-medium text-foreground">v{template?.version ?? "-"}</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-card rounded-lg border border-border p-5 overflow-x-auto">
        <h3 className="text-[13px] font-medium text-foreground mb-4">{year}년 루틴 달성 현황</h3>
        <div className="flex mb-1 ml-8" style={{ gap: 0 }}>
          {monthPositions.map((m, i) => {
            const nextCol = monthPositions[i + 1]?.col ?? weeks.length;
            const width = (nextCol - m.col) * 14;
            return (
              <span key={m.label} className="text-[10px] text-muted-foreground" style={{ width, flexShrink: 0 }}>
                {m.label}
              </span>
            );
          })}
        </div>
        <div className="flex gap-0">
          <div className="flex flex-col mr-1" style={{ gap: 2 }}>
            {["일","월","화","수","목","금","토"].map((d, i) => (
              <span key={d} className="text-[9px] text-muted-foreground h-[12px] leading-[12px]" style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}>
                {d}
              </span>
            ))}
          </div>
          <div className="flex" style={{ gap: 2 }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col" style={{ gap: 2 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date.getFullYear() === year ? `${day.date.getMonth()+1}/${day.date.getDate()} — ${day.rate >= 0 ? Math.round(day.rate*100)+'%' : ''}` : ''}
                    className={`w-[12px] h-[12px] rounded-[2px] transition-colors duration-150 ${
                      day.isFuture || day.date.getFullYear() !== year
                        ? "bg-secondary/30"
                        : day.isToday
                        ? `${getRateColor(day.rate)} ring-1 ring-primary`
                        : getRateColor(day.rate)
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 ml-8">
          <span className="text-[10px] text-muted-foreground mr-1">Less</span>
          <div className="w-[12px] h-[12px] rounded-[2px] bg-secondary" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(142_50%_20%)]" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(142_50%_30%)]" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(142_50%_38%)]" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(142_50%_45%)]" />
          <span className="text-[10px] text-muted-foreground ml-1">More</span>
        </div>
      </div>

      <RoutineEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </div>
  );
}
