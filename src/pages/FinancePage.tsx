import { useState, useEffect, useRef, useMemo } from "react";
import { loadJSON, saveJSON, type Expense } from "@/lib/store";
import { Trash2, TrendingDown, Share2, Upload, X } from "lucide-react";
import { shareFinanceSummary } from "@/lib/community";
import { toast } from "sonner";

const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getDaysInYear(year: number) {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
  return days;
}

function spendColor(amount: number, max: number): string {
  if (amount <= 0) return "bg-secondary";
  const r = Math.min(1, amount / Math.max(1, max));
  if (r < 0.2) return "bg-[hsl(14_55%_82%)] dark:bg-[hsl(14_40%_28%)]";
  if (r < 0.4) return "bg-[hsl(14_60%_72%)] dark:bg-[hsl(14_50%_38%)]";
  if (r < 0.7) return "bg-[hsl(14_62%_62%)] dark:bg-[hsl(14_60%_50%)]";
  return "bg-[hsl(12_70%_50%)] dark:bg-[hsl(14_75%_60%)]";
}

const CATEGORIES = [
  { key: "식비", color: "bg-orange-500" },
  { key: "카페", color: "bg-amber-600" },
  { key: "교통", color: "bg-blue-500" },
  { key: "쇼핑", color: "bg-pink-500" },
  { key: "운동", color: "bg-green-500" },
  { key: "의료", color: "bg-red-500" },
  { key: "문화", color: "bg-purple-500" },
  { key: "구독", color: "bg-cyan-500" },
  { key: "기타", color: "bg-gray-500" },
];

const BUDGET = 2000000; // 200만원

export default function FinancePage() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadJSON(`expenses_${monthKey}`, [])
  );
  const [category, setCategory] = useState("식비");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDate(now));
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // forces year-heatmap recompute after import

  useEffect(() => {
    saveJSON(`expenses_${monthKey}`, expenses);
  }, [expenses, monthKey]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = Math.min((total / BUDGET) * 100, 100);

  const addExpense = () => {
    if (!name.trim() || !amount) return;
    const targetMonth = date.slice(0, 7);
    const exp: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      category,
      name: name.trim(),
      amount: Number(amount),
    };
    if (targetMonth === monthKey) {
      setExpenses((prev) => [exp, ...prev]);
    } else {
      const existing = loadJSON<Expense[]>(`expenses_${targetMonth}`, []);
      const merged = [exp, ...existing].sort((a, b) => (a.date < b.date ? 1 : -1));
      saveJSON(`expenses_${targetMonth}`, merged);
      setTick((t) => t + 1);
      toast.success(`${targetMonth} 에 추가됐어요`);
    }
    setName("");
    setAmount("");
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const importJSON = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("배열 형태의 JSON이 아닙니다");

      // group by YYYY-MM
      const byMonth: Record<string, Expense[]> = {};
      let imported = 0;
      let skipped = 0;
      const base = Date.now();
      for (const row of data) {
        if (!row || typeof row !== "object") { skipped++; continue; }
        const date = String(row.date ?? "");
        const m = /^(\d{4})-(\d{2})/.exec(date);
        const name = String(row.name ?? "").trim();
        const category = String(row.category ?? "기타");
        const amount = Number(row.amount);
        if (!m || !name || !Number.isFinite(amount)) { skipped++; continue; }
        const key = `${m[1]}-${m[2]}`;
        const exp: Expense = {
          id: `${base}-${imported}`,
          date,
          category,
          name,
          amount,
        };
        (byMonth[key] ||= []).push(exp);
        imported++;
      }

      // append into existing per-month buckets
      for (const [key, items] of Object.entries(byMonth)) {
        const existing = loadJSON<Expense[]>(`expenses_${key}`, []);
        const merged = [...items, ...existing];
        merged.sort((a, b) => (a.date < b.date ? 1 : -1));
        saveJSON(`expenses_${key}`, merged);
      }

      // refresh current month view
      setExpenses(loadJSON(`expenses_${monthKey}`, []));
      setTick((t) => t + 1);

      toast.success(`${imported}건 가져왔어요${skipped ? ` (건너뜀 ${skipped})` : ""}`);
    } catch (err: any) {
      toast.error(err?.message ?? "JSON 파싱 실패");
    }
  };

  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  // Aggregate full-year daily totals across every monthly bucket
  const year = now.getFullYear();
  const dailyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, "0")}`;
      const rows = loadJSON<Expense[]>(`expenses_${key}`, []);
      for (const e of rows) map[e.date] = (map[e.date] ?? 0) + (e.amount || 0);
    }
    return map;
    // include `expenses` so the current month re-aggregates as user edits, and tick for imports/cross-month adds
  }, [year, expenses, tick]);

  const days = useMemo(() => getDaysInYear(year), [year]);
  const maxDaily = useMemo(() => {
    let m = 0;
    for (const v of Object.values(dailyTotals)) if (v > m) m = v;
    return m;
  }, [dailyTotals]);
  const yearTotal = useMemo(
    () => Object.values(dailyTotals).reduce((s, v) => s + v, 0),
    [dailyTotals]
  );
  const recordedDays = useMemo(
    () => Object.values(dailyTotals).filter((v) => v > 0).length,
    [dailyTotals]
  );

  const heatmapWeeks = useMemo(() => {
    const cells = days.map((d) => {
      const key = isoDate(d);
      const amt = dailyTotals[key] ?? 0;
      const isToday = d.toDateString() === now.toDateString();
      return { date: d, key, amount: amt, isToday };
    });
    const weeks: typeof cells[] = [];
    let cur: typeof cells = [];
    const firstDow = days[0].getDay();
    for (let i = 0; i < firstDow; i++) cur.push({ date: new Date(0), key: "", amount: 0, isToday: false });
    cells.forEach((c) => {
      cur.push(c);
      if (cur.length === 7) { weeks.push(cur); cur = []; }
    });
    if (cur.length) {
      while (cur.length < 7) cur.push({ date: new Date(0), key: "", amount: 0, isToday: false });
      weeks.push(cur);
    }
    return weeks;
  }, [days, dailyTotals]);

  const monthPositions = useMemo(() => {
    const pos: { label: string; col: number }[] = [];
    let lastMonth = -1;
    heatmapWeeks.forEach((week, wi) => {
      const valid = week.find((d) => d.date.getFullYear() === year);
      if (valid && valid.date.getMonth() !== lastMonth) {
        lastMonth = valid.date.getMonth();
        pos.push({ label: MONTHS_KO[lastMonth], col: wi });
      }
    });
    return pos;
  }, [heatmapWeeks, year]);

  // Filtered expenses for list view (when a heatmap day is selected)
  const visibleExpenses = useMemo(() => {
    if (!filterDate) return expenses;
    // if filter is in current month, just filter local; else load from that month bucket
    if (filterDate.startsWith(monthKey)) return expenses.filter((e) => e.date === filterDate);
    const month = filterDate.slice(0, 7);
    const rows = loadJSON<Expense[]>(`expenses_${month}`, []);
    return rows.filter((e) => e.date === filterDate);
  }, [filterDate, expenses, monthKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addExpense();
  };

  return (
    <div className="flex gap-6 animate-fade-up">
      <div className="flex-1 max-w-2xl">
        {/* Month header */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-foreground mb-1">
              {now.getFullYear()}년 {now.getMonth() + 1}월
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-medium text-foreground">
                {total.toLocaleString()}원
              </span>
              <span className="text-[13px] text-muted-foreground">
                / {BUDGET.toLocaleString()}원
              </span>
            </div>
            {/* Budget bar */}
            <div className="h-2 bg-secondary rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPct > 80 ? "bg-destructive" : budgetPct > 50 ? "bg-primary" : "bg-success"
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!expenses.length) {
                toast.error("이번 달 지출이 아직 없어요");
                return;
              }
              const totals: Record<string, number> = {};
              expenses.forEach((e) => {
                totals[e.category] = (totals[e.category] ?? 0) + e.amount;
              });
              try {
                await shareFinanceSummary({
                  year: now.getFullYear(),
                  month: now.getMonth() + 1,
                  totals,
                });
                toast.success("이번 달 지출 요약이 공유됐어요");
              } catch (e: any) {
                toast.error(e.message ?? "공유 실패");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-border bg-card hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> 이달 공유
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-border bg-card hover:border-primary/40 hover:text-primary transition-colors"
            title="JSON 파일에서 지출 가져오기"
          >
            <Upload className="w-3.5 h-3.5" /> JSON 가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJSON(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Input */}
        <div className="bg-card rounded-lg border border-border p-4 mb-6">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors duration-150 active:scale-[0.97] ${
                  category === c.key
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.key}
              </button>
            ))}
          </div>
          <div className="flex gap-3" onKeyDown={handleKeyDown}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="지출 내역"
              className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="금액"
              className="w-32 bg-secondary rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono text-right"
            />
            <button
              onClick={addExpense}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:brightness-110 transition-all duration-150 active:scale-[0.97]"
            >
              추가
            </button>
          </div>
        </div>

        {/* Expense list */}
        <div className="space-y-1">
          {expenses.map((exp) => {
            const cat = CATEGORIES.find((c) => c.key === exp.category);
            return (
              <div
                key={exp.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-secondary/50 transition-colors duration-150 group"
              >
                <div className={`w-2 h-2 rounded-full ${cat?.color ?? "bg-gray-500"}`} />
                <span className="text-[12px] text-muted-foreground w-16">{exp.category}</span>
                <span className="text-[13px] text-foreground flex-1">{exp.name}</span>
                <span className="text-[13px] font-mono text-foreground">
                  {exp.amount.toLocaleString()}원
                </span>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-150"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-64 space-y-4 stagger-children">
        {/* Category breakdown */}
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            카테고리별 지출
          </span>
          <div className="mt-3 space-y-2">
            {categoryTotals.map((c) => {
              const pct = total > 0 ? (c.total / total) * 100 : 0;
              return (
                <div key={c.key}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-foreground">{c.key}</span>
                    <span className="font-mono text-muted-foreground">
                      {c.total.toLocaleString()}원
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI analysis */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              AI 지출 분석
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            지출을 기록하면 AI가 소비 패턴을 분석하고 절약 팁을 제공합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
