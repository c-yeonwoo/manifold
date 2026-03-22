import { useState, useEffect } from "react";
import { loadJSON, saveJSON, type Expense } from "@/lib/store";
import { Trash2, TrendingDown } from "lucide-react";

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

  useEffect(() => {
    saveJSON(`expenses_${monthKey}`, expenses);
  }, [expenses, monthKey]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = Math.min((total / BUDGET) * 100, 100);

  const addExpense = () => {
    if (!name.trim() || !amount) return;
    const newExp: Expense = {
      id: Date.now().toString(),
      date: now.toISOString().slice(0, 10),
      category,
      name: name.trim(),
      amount: Number(amount),
    };
    setExpenses((prev) => [newExp, ...prev]);
    setName("");
    setAmount("");
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const categoryTotals = CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addExpense();
  };

  return (
    <div className="flex gap-6 animate-fade-up">
      <div className="flex-1 max-w-2xl">
        {/* Month header */}
        <div className="mb-6">
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
