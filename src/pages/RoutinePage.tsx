import { useState, useEffect, useMemo } from "react";
import { loadJSON, saveJSON, getTodayKey, DEFAULT_ROUTINES, type RoutineItem } from "@/lib/store";

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
  const done = data.filter(i => i.done).length;
  return done / data.length;
}

function getRateColor(rate: number): string {
  if (rate === 0) return "bg-secondary";
  if (rate < 0.3) return "bg-[hsl(142_50%_20%)]";
  if (rate < 0.6) return "bg-[hsl(142_50%_30%)]";
  if (rate < 0.9) return "bg-[hsl(142_50%_38%)]";
  return "bg-[hsl(142_50%_45%)]";
}

export default function RoutinePage() {
  const year = new Date().getFullYear();
  const days = useMemo(() => getDaysInYear(year), [year]);
  const today = new Date();
  const todayStr = getTodayKey("routine");

  const [items, setItems] = useState<RoutineItem[]>(() => loadJSON(todayStr, DEFAULT_ROUTINES));

  useEffect(() => { saveJSON(todayStr, items); }, [items, todayStr]);

  const toggle = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, done: !it.done } : it));
  };

  // Build heatmap data
  const heatmapData = useMemo(() => {
    return days.map(d => {
      const key = getDateKey(d);
      const isFuture = d > today;
      const isToday = d.toDateString() === today.toDateString();
      const rate = isFuture ? -1 : (isToday ? items.filter(i=>i.done).length / items.length : getCompletionRate(key));
      return { date: d, rate, isFuture, isToday };
    });
  }, [days, items, today]);

  // Group by week (columns) for GitHub-style grid
  const weeks: typeof heatmapData[number][][] = [];
  let currentWeek: typeof heatmapData[number][] = [];
  // Pad first week
  const firstDayOfWeek = days[0].getDay(); // 0=Sun
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push({ date: new Date(0), rate: -1, isFuture: true, isToday: false });
  heatmapData.forEach(d => {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length) {
    while (currentWeek.length < 7) currentWeek.push({ date: new Date(0), rate: -1, isFuture: true, isToday: false });
    weeks.push(currentWeek);
  }

  // Month label positions
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
      <div className="bg-card rounded-lg border border-border p-5 mb-6 overflow-x-auto">
        <h3 className="text-[13px] font-medium text-foreground mb-4">{year}년 루틴 달성 현황</h3>
        {/* Month labels */}
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
          {/* Day labels */}
          <div className="flex flex-col mr-1" style={{ gap: 2 }}>
            {["일","월","화","수","목","금","토"].map((d, i) => (
              <span key={d} className="text-[9px] text-muted-foreground h-[12px] leading-[12px]" style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}>
                {d}
              </span>
            ))}
          </div>
          {/* Grid */}
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
        {/* Legend */}
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

      {/* Today's checklist */}
      <div className="bg-card rounded-lg border border-border p-5">
        <h3 className="text-[13px] font-medium text-foreground mb-4">오늘의 루틴</h3>
        <div className="space-y-1.5">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="flex items-center gap-3 w-full text-left py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors duration-150 group"
            >
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                item.done ? "border-[hsl(142_50%_45%)] bg-[hsl(142_50%_45%/0.2)]" : "border-muted-foreground/30 group-hover:border-primary"
              }`}>
                {item.done && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="hsl(142, 50%, 45%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-[13px] transition-colors duration-150 ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
