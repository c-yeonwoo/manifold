import { useState, useEffect } from "react";
import { loadJSON, saveJSON } from "@/lib/store";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Plus, Trash2 } from "lucide-react";

interface PortfolioItem {
  id: string;
  name: string;
  percent: number;
  color: string;
}

const COLORS = [
  "hsl(38, 40%, 60%)",
  "hsl(142, 50%, 45%)",
  "hsl(210, 50%, 55%)",
  "hsl(0, 62%, 50%)",
  "hsl(270, 40%, 55%)",
  "hsl(180, 40%, 45%)",
  "hsl(30, 60%, 50%)",
  "hsl(330, 40%, 50%)",
];

const DEFAULT_ITEMS: PortfolioItem[] = [
  { id: "1", name: "미국 주식", percent: 40, color: COLORS[0] },
  { id: "2", name: "한국 주식", percent: 20, color: COLORS[1] },
  { id: "3", name: "채권", percent: 15, color: COLORS[2] },
  { id: "4", name: "부동산", percent: 15, color: COLORS[3] },
  { id: "5", name: "현금", percent: 10, color: COLORS[4] },
];

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>(() => loadJSON("portfolio_items", DEFAULT_ITEMS));
  const [newName, setNewName] = useState("");
  const [newPct, setNewPct] = useState("");

  useEffect(() => { saveJSON("portfolio_items", items); }, [items]);

  const total = items.reduce((s, i) => s + i.percent, 0);

  const addItem = () => {
    if (!newName.trim() || !newPct) return;
    const pct = parseFloat(newPct);
    if (isNaN(pct) || pct <= 0) return;
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      percent: pct,
      color: COLORS[prev.length % COLORS.length],
    }]);
    setNewName("");
    setNewPct("");
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updatePercent = (id: string, val: string) => {
    const pct = parseFloat(val);
    if (isNaN(pct)) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, percent: pct } : i));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") addItem();
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="flex gap-6">
        {/* Chart */}
        <div className="bg-card rounded-lg border border-border p-6 flex-1">
          <h3 className="text-[13px] font-medium text-foreground mb-4">포트폴리오 비율</h3>
          <div className="w-full" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={items}
                  dataKey="percent"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={60}
                  strokeWidth={2}
                  stroke="hsl(220, 8%, 8%)"
                >
                  {items.map((item, i) => (
                    <Cell key={item.id} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(220, 8%, 10%)", border: "1px solid hsl(220, 6%, 16%)", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "hsl(40, 10%, 88%)" }}
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className={`text-[12px] font-mono ${total === 100 ? "text-[hsl(142,50%,45%)]" : "text-destructive"}`}>
              합계: {total}%
            </span>
          </div>
        </div>

        {/* Item list */}
        <div className="w-64 space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-[13px] font-medium text-foreground mb-3">항목 관리</h3>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[12px] text-foreground flex-1 truncate">{item.name}</span>
                  <input
                    type="number"
                    value={item.percent}
                    onChange={e => updatePercent(item.id, e.target.value)}
                    className="w-14 text-right text-[12px] font-mono bg-secondary border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-[11px] text-muted-foreground">%</span>
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors duration-150 active:scale-[0.95]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {/* Add new */}
            <div className="border-t border-border pt-3 space-y-2" onKeyDown={handleKeyDown}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="항목명"
                className="w-full text-[12px] bg-secondary border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newPct}
                  onChange={e => setNewPct(e.target.value)}
                  placeholder="%"
                  className="flex-1 text-[12px] font-mono bg-secondary border border-border rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={addItem}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all duration-150 active:scale-[0.97] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
