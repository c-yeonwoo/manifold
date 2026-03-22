import { useMemo, useSyncExternalStore } from "react";
import { loadJSON, getTodayKey, DEFAULT_ROUTINES, type RoutineItem } from "@/lib/store";

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function getDateKey(d: Date) {
  return `routine_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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

function getCompletionRate(key: string): number {
  const data = loadJSON<RoutineItem[]>(key, []);
  if (!data.length) return 0;
  return data.filter(i => i.done).length / data.length;
}

function getRateColor(rate: number): string {
  if (rate === 0) return "bg-secondary";
  if (rate < 0.3) return "bg-[hsl(142_50%_20%)]";
  if (rate < 0.6) return "bg-[hsl(142_50%_30%)]";
  if (rate < 0.9) return "bg-[hsl(142_50%_38%)]";
  return "bg-[hsl(142_50%_45%)]";
}

// Subscribe to localStorage changes from Sidebar
function useRoutineItems(): RoutineItem[] {
  const todayKey = getTodayKey("routine");
  const subscribe = (cb: () => void) => {
    const handler = (e: StorageEvent) => { if (e.key === todayKey) cb(); };
    // Also listen to custom event for same-tab updates
    const customHandler = () => cb();
    window.addEventListener("storage", handler);
    window.addEventListener("routine-updated", customHandler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("routine-updated", customHandler);
    };
  };
  const getSnapshot = () => localStorage.getItem(todayKey) ?? "";
  const raw = useSyncExternalStore(subscribe, getSnapshot);
  return raw ? JSON.parse(raw) : DEFAULT_ROUTINES;
}

export default function RoutinePage() {
  const year = new Date().getFullYear();
  const days = useMemo(() => getDaysInYear(year), [year]);
  const today = new Date();
  const items = useRoutineItems();

  const heatmapData = useMemo(() => {
    return days.map(d => {
      const key = getDateKey(d);
      const isFuture = d > today;
      const isToday = d.toDateString() === today.toDateString();
      const rate = isFuture ? -1 : (isToday ? items.filter(i=>i.done).length / items.length : getCompletionRate(key));
      return { date: d, rate, isFuture, isToday };
    });
  }, [days, items, today]);

  const weeks: typeof heatmapData[number][][] = [];
  let currentWeek: typeof heatmapData[number][] = [];
  const firstDayOfWeek = days[0].getDay();
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push({ date: new Date(0), rate: -1, isFuture: true, isToday: false });
  heatmapData.forEach(d => {
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
      const validDay = week.find(d => d.date.getFullYear() === year);
      if (validDay && validDay.date.getMonth() !== lastMonth) {
        lastMonth = validDay.date.getMonth();
        pos.push({ label: MONTHS[lastMonth], col: wi });
      }
    });
    return pos;
  }, [weeks, year]);

  const doneCount = items.filter(i => i.done).length;
  const totalCount = items.length;
  const todayPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-5xl animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        <div className="bg-card rounded-lg p-4 border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">오늘 달성률</span>
          <span className="text-2xl font-mono font-medium text-foreground">{todayPct}%</span>
          <span className="text-[12px] text-muted-foreground ml-2">{doneCount}/{totalCount}</span>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">연속 달성</span>
          <span className="text-2xl font-mono font-medium text-foreground">—</span>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">이번 달 평균</span>
          <span className="text-2xl font-mono font-medium text-foreground">—</span>
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
    </div>
  );
}
