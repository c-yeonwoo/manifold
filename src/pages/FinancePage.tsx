import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Trash2, TrendingDown, Upload, X, Loader2, ChevronDown, Calendar as CalendarIcon, Check, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  listExpensesByMonth,
  listExpensesByYear,
  createExpense,
  bulkCreateExpenses,
  deleteExpense as deleteExpenseDb,
  notifyExpensesChanged,
  type Expense,
} from "@/lib/expenses";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const QUICK_CATS = ["식비", "카페", "교통", "쇼핑"];
const QUICK_AMOUNTS = [1000, 5000, 10000];

function formatAmount(v: string) {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString();
}
function parseAmount(v: string) {
  return Number(v.replace(/[^\d]/g, ""));
}

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
  const { user } = useAuth();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const year = now.getFullYear();

  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [yearExpenses, setYearExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("식비");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(""); // formatted with commas
  const [date, setDate] = useState<Date>(now);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [justSaved, setJustSaved] = useState(false);
  const [moreCatOpen, setMoreCatOpen] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [m, y] = await Promise.all([
        listExpensesByMonth(user.id, monthKey),
        listExpensesByYear(user.id, year),
      ]);
      setMonthExpenses(m);
      setYearExpenses(y);
    } catch (e: any) {
      toast.error(e.message ?? "지출을 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [user, monthKey, year]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const total = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = Math.min((total / BUDGET) * 100, 100);

  const addExpense = async () => {
    if (!user || !name.trim() || !amount) return;
    const amt = parseAmount(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("올바른 금액을 입력해주세요");
      return;
    }
    setBusy(true);
    try {
      const dateStr = isoDate(date);
      await createExpense({
        user_id: user.id,
        date: dateStr,
        category,
        name: name.trim(),
        amount: amt,
      });
      setName("");
      setAmount("");
      const targetMonth = dateStr.slice(0, 7);
      if (targetMonth !== monthKey) {
        toast.success(`${targetMonth} 에 추가됐어요`);
      } else {
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 1200);
      }
      notifyExpensesChanged();
      await refresh();
      // keep category, refocus name for continuous entry
      window.setTimeout(() => nameInputRef.current?.focus(), 0);
    } catch (e: any) {
      toast.error(e.message ?? "추가 실패");
    } finally {
      setBusy(false);
    }
  };

  const removeExpense = async (id: string) => {
    try {
      await deleteExpenseDb(id);
      notifyExpensesChanged();
      await refresh();
    } catch (e: any) {
      toast.error(e.message ?? "삭제 실패");
    }
  };

  const fileRef = useRef<HTMLInputElement>(null);

  const importJSON = async (file: File) => {
    if (!user) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error("배열 형태의 JSON이 아닙니다");

      const rows: Array<{
        user_id: string;
        date: string;
        category: string;
        name: string;
        amount: number;
      }> = [];
      let skipped = 0;
      for (const row of data) {
        if (!row || typeof row !== "object") { skipped++; continue; }
        const d = String(row.date ?? "");
        const m = /^\d{4}-\d{2}-\d{2}/.exec(d);
        const nm = String(row.name ?? "").trim();
        const cat = String(row.category ?? "기타");
        const amt = Number(row.amount);
        if (!m || !nm || !Number.isFinite(amt) || amt < 0) { skipped++; continue; }
        rows.push({
          user_id: user.id,
          date: d.slice(0, 10),
          category: cat,
          name: nm,
          amount: amt,
        });
      }
      if (!rows.length) {
        toast.error(`가져올 항목이 없어요${skipped ? ` (건너뜀 ${skipped})` : ""}`);
        return;
      }
      setBusy(true);
      const inserted = await bulkCreateExpenses(rows);
      notifyExpensesChanged();
      await refresh();
      toast.success(`${inserted}건 가져왔어요${skipped ? ` (건너뜀 ${skipped})` : ""}`);
    } catch (err: any) {
      toast.error(err?.message ?? "JSON 파싱 실패");
    } finally {
      setBusy(false);
    }
  };

  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: monthExpenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  // Recent name suggestions for the currently selected category
  const nameSuggestions = useMemo(() => {
    const seen = new Map<string, { name: string; amount: number }>();
    const sorted = [...yearExpenses].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : (a.created_at < b.created_at ? 1 : -1)
    );
    for (const e of sorted) {
      if (e.category !== category) continue;
      const key = e.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.set(key, { name: e.name, amount: e.amount });
      if (seen.size >= 5) break;
    }
    return Array.from(seen.values());
  }, [yearExpenses, category]);


  // Daily totals across the entire year (from yearExpenses)
  const dailyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of yearExpenses) map[e.date] = (map[e.date] ?? 0) + e.amount;
    return map;
  }, [yearExpenses]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!filterDate) return monthExpenses;
    const inMonth = filterDate.startsWith(monthKey);
    const source = inMonth ? monthExpenses : yearExpenses;
    return source.filter((e) => e.date === filterDate);
  }, [filterDate, monthExpenses, yearExpenses, monthKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addExpense();
  };

  return (
    <div className="flex gap-6 animate-fade-up">
      <div className="flex-1 max-w-2xl">
        {/* Month header */}
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]">
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
          <div className="flex gap-2 self-start">
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border border-border bg-card hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
              disabled={busy}
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
        </div>

        {/* Input */}
        <div className={`bg-card rounded-lg border p-4 mb-6 transition-colors ${justSaved ? "border-success" : "border-border"}`}>
          {/* Row 1: name + amount + add */}
          <div className="flex gap-2 items-stretch" onKeyDown={handleKeyDown}>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="지출 내역"
              className="flex-1 bg-secondary rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40"
              autoFocus
            />
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(formatAmount(e.target.value))}
                placeholder="금액"
                className="w-32 bg-secondary rounded-md pl-3 pr-6 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none font-mono text-right focus:ring-1 focus:ring-primary/40"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">원</span>
            </div>
            <button
              onClick={addExpense}
              disabled={busy || !name.trim() || !amount}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:brightness-110 transition-all duration-150 active:scale-[0.97] disabled:opacity-50 inline-flex items-center gap-1.5 min-w-[68px] justify-center"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : justSaved ? <Check className="w-3.5 h-3.5" /> : "추가"}
            </button>
          </div>

          {/* Row 2: quick amount + date */}
          <div className="flex items-center gap-2 mt-2 text-[11px]">
            <span className="text-muted-foreground">빠른 가산</span>
            {QUICK_AMOUNTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(formatAmount(String((parseAmount(amount) || 0) + q)))}
                className="px-2 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/70 font-mono"
              >
                +{q.toLocaleString()}
              </button>
            ))}
            <div className="flex-1" />
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary font-mono"
                >
                  <CalendarIcon className="w-3 h-3" />
                  {isoDate(date) === isoDate(now) ? "오늘" : format(date, "M/d (EEE)")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Row 3: category chips (quick + more) */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_CATS.map((k) => {
              const c = CATEGORIES.find((cc) => cc.key === k)!;
              const active = category === k;
              return (
                <button
                  key={k}
                  onClick={() => setCategory(k)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors active:scale-[0.97] ${
                    active ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                  {k}
                </button>
              );
            })}
            {!QUICK_CATS.includes(category) && (
              <button
                onClick={() => setCategory(category)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium bg-primary/15 text-primary ring-1 ring-primary/30"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${CATEGORIES.find((c) => c.key === category)?.color ?? "bg-gray-500"}`} />
                {category}
              </button>
            )}
            <Popover open={moreCatOpen} onOpenChange={setMoreCatOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] bg-secondary text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-3 h-3" /> 기타
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1.5" align="start">
                <div className="grid grid-cols-2 gap-1">
                  {CATEGORIES.filter((c) => !QUICK_CATS.includes(c.key)).map((c) => (
                    <button
                      key={c.key}
                      onClick={() => { setCategory(c.key); setMoreCatOpen(false); }}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[12px] hover:bg-secondary text-left ${
                        category === c.key ? "text-primary" : "text-foreground"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                      {c.key}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Row 4: autocomplete from recent names in this category */}
          {nameSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-border/60">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center">최근</span>
              {nameSuggestions.map((s) => (
                <button
                  key={s.name + s.amount}
                  onClick={() => { setName(s.name); setAmount(formatAmount(String(s.amount))); }}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary/60 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  {s.name}
                  <span className="font-mono text-[10px] opacity-70">{s.amount.toLocaleString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter chip */}
        {filterDate && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] bg-primary/10 text-primary border border-primary/20">
              {filterDate} 만 보기
              <button onClick={() => setFilterDate(null)} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Expense list */}
        <div className="space-y-1">
          {loading && (
            <p className="text-[12px] text-muted-foreground italic px-3 py-4 inline-flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> 불러오는 중…
            </p>
          )}
          {!loading && visibleExpenses.length === 0 && (
            <p className="text-[12px] text-muted-foreground italic px-3 py-4">
              {filterDate ? "이 날짜에는 지출이 없어요" : "이번 달 지출이 아직 없어요"}
            </p>
          )}
          {!loading && !filterDate && visibleExpenses.length > 0 && (
            <div className="space-y-1">
              {categoryTotals.map((c) => {
                const items = monthExpenses
                  .filter((e) => e.category === c.key)
                  .sort((a, b) => (a.date < b.date ? 1 : -1));
                const isOpen = openCategories[c.key] ?? false;
                return (
                  <div key={c.key} className="border border-border rounded-md overflow-hidden">
                    <button
                      onClick={() => setOpenCategories((s) => ({ ...s, [c.key]: !isOpen }))}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${c.color}`} />
                      <span className="text-[13px] text-foreground flex-1 text-left">{c.key}</span>
                      <span className="text-[11px] text-muted-foreground">{items.length}건</span>
                      <span className="text-[13px] font-mono text-foreground">
                        {c.total.toLocaleString()}원
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border bg-secondary/20">
                        {items.map((exp) => (
                          <div
                            key={exp.id}
                            className="flex items-center gap-3 py-2 px-3 hover:bg-secondary/50 transition-colors group"
                          >
                            <span className="text-[11px] font-mono text-muted-foreground w-12">
                              {exp.date.slice(5)}
                            </span>
                            <span className="text-[13px] text-foreground flex-1">{exp.name}</span>
                            <span className="text-[13px] font-mono text-foreground">
                              {exp.amount.toLocaleString()}원
                            </span>
                            <button
                              onClick={() => removeExpense(exp.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                              aria-label="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {!loading && filterDate && visibleExpenses.map((exp) => {
            const cat = CATEGORIES.find((c) => c.key === exp.category);
            return (
              <div
                key={exp.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-secondary/50 transition-colors duration-150 group"
              >
                <div className={`w-2 h-2 rounded-full ${cat?.color ?? "bg-gray-500"}`} />
                <span className="text-[11px] font-mono text-muted-foreground w-12">{exp.date.slice(5)}</span>
                <span className="text-[12px] text-muted-foreground w-14">{exp.category}</span>
                <span className="text-[13px] text-foreground flex-1">{exp.name}</span>
                <span className="text-[13px] font-mono text-foreground">
                  {exp.amount.toLocaleString()}원
                </span>
                <button
                  onClick={() => removeExpense(exp.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-150"
                  aria-label="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Year heatmap */}
        <div className="mt-8 bg-card rounded-lg border border-border p-5 overflow-x-auto">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-[13px] font-medium text-foreground">{year}년 일별 지출</h3>
            <div className="text-[11px] text-muted-foreground font-mono">
              {recordedDays}일 · {yearTotal.toLocaleString()}원
            </div>
          </div>
          <div className="flex mb-1 ml-8" style={{ gap: 0 }}>
            {monthPositions.map((m, i) => {
              const nextCol = monthPositions[i + 1]?.col ?? heatmapWeeks.length;
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
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: 2 }}>
                  {week.map((day, di) => {
                    const valid = day.date.getFullYear() === year;
                    const selected = filterDate === day.key;
                    return (
                      <button
                        key={di}
                        disabled={!valid}
                        onClick={() => {
                          if (!valid) return;
                          setFilterDate((cur) => (cur === day.key ? null : day.key));
                        }}
                        title={valid ? `${day.date.getMonth()+1}/${day.date.getDate()} — ${day.amount.toLocaleString()}원` : ""}
                        className={`w-[12px] h-[12px] rounded-[2px] transition-colors duration-150 ${
                          !valid
                            ? "bg-secondary/30"
                            : selected
                              ? `${spendColor(day.amount, maxDaily)} ring-2 ring-primary`
                              : day.isToday
                                ? `${spendColor(day.amount, maxDaily)} ring-1 ring-primary`
                                : spendColor(day.amount, maxDaily)
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3 ml-8">
            <span className="text-[10px] text-muted-foreground mr-1">Less</span>
            <div className="w-[12px] h-[12px] rounded-[2px] bg-secondary" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(14_55%_82%)] dark:bg-[hsl(14_40%_28%)]" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(14_60%_72%)] dark:bg-[hsl(14_50%_38%)]" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(14_62%_62%)] dark:bg-[hsl(14_60%_50%)]" />
            <div className="w-[12px] h-[12px] rounded-[2px] bg-[hsl(12_70%_50%)] dark:bg-[hsl(14_75%_60%)]" />
            <span className="text-[10px] text-muted-foreground ml-1">More</span>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-64 space-y-4 stagger-children shrink-0">
        {/* Category breakdown */}
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            카테고리별 지출
          </span>
          <div className="mt-3 space-y-2">
            {categoryTotals.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">아직 데이터가 없어요</p>
            )}
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

        {/* AI analysis placeholder */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              AI 지출 분석
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            지출을 기록하면 AI가 소비 패턴을 분석하고 절약 팁을 제공합니다. (준비 중)
          </p>
        </div>
      </div>
    </div>
  );
}
