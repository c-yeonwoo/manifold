import { useState, useEffect } from "react";
import { loadJSON, saveJSON, type EconomyEntry } from "@/lib/store";
import { BookOpen, MessageSquare, Link2, Hash, Calendar, Flame, TrendingUp } from "lucide-react";

const MODES = [
  { key: "paste" as const, label: "글 붙여넣기", icon: BookOpen },
  { key: "qa" as const, label: "질문/분석", icon: MessageSquare },
  { key: "connect" as const, label: "인사이트 연결", icon: Link2 },
];

export default function EconomyPage() {
  const [entries, setEntries] = useState<EconomyEntry[]>(() =>
    loadJSON("economy_entries", [])
  );
  const [mode, setMode] = useState<"paste" | "qa" | "connect">("paste");
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    saveJSON("economy_entries", entries);
  }, [entries]);

  const savedEntries = entries.filter((e) => e.saved);
  const todayCount = entries.filter(
    (e) => e.date === new Date().toISOString().slice(0, 10)
  ).length;

  // Simulated AI response for demo
  const handleSubmit = () => {
    if (!input.trim()) return;
    setIsProcessing(true);

    setTimeout(() => {
      const newEntry: EconomyEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().slice(0, 10),
        mode,
        input: input.trim(),
        response:
          mode === "paste"
            ? `📌 핵심 요약: ${input.slice(0, 60)}...\n\n• 주요 포인트 1: 거시 경제 흐름과의 연관성\n• 주요 포인트 2: 투자 관점에서의 시사점\n• 연관 인사이트: #${savedEntries.length > 0 ? savedEntries.length : 1}번과 연결`
            : mode === "qa"
            ? `분석 결과:\n\n${input.slice(0, 40)}에 대한 답변입니다.\n\n현재 시장 상황과 결합하면, 이 주제는 금리 정책과 밀접한 관련이 있습니다.`
            : `🔗 인사이트 연결 분석:\n\n기존 #${savedEntries.length}개 인사이트와 교차 분석 완료.\n\n패턴: 최근 3개 인사이트가 '금리 인하' 테마로 수렴 중.`,
        tags: ["경제", "시장분석", mode === "connect" ? "인사이트연결" : "신규"],
        saved: false,
      };
      setEntries((prev) => [newEntry, ...prev]);
      setInput("");
      setIsProcessing(false);
    }, 800);
  };

  const saveEntry = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, saved: true } : e))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="max-w-4xl animate-fade-up">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6 stagger-children">
        {[
          { label: "누적 인사이트", value: savedEntries.length, icon: Hash },
          { label: "오늘", value: todayCount, icon: Calendar },
          { label: "연속 학습", value: "7일", icon: Flame },
          { label: "Top 토픽", value: "금리", icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            <span className="text-xl font-mono font-medium text-foreground">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 active:scale-[0.97] ${
              mode === m.key
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "paste"
              ? "경제 기사나 뉴스를 붙여넣으세요..."
              : mode === "qa"
              ? "질문이나 분석하고 싶은 주제를 입력하세요..."
              : "기존 인사이트와 연결할 내용을 입력하세요..."
          }
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed min-h-[120px]"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground">⌘ + Enter로 제출</span>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
          >
            {isProcessing ? "분석 중..." : "AI 분석"}
          </button>
        </div>
      </div>

      {/* Result cards */}
      <div className="space-y-3 stagger-children">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-card rounded-lg border border-border p-4 animate-fade-up"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-mono text-muted-foreground">
                {entry.date}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                {entry.mode === "paste" ? "붙여넣기" : entry.mode === "qa" ? "Q&A" : "연결"}
              </span>
              {entry.saved && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success">
                  #{savedEntries.indexOf(entry) + 1} 저장됨
                </span>
              )}
            </div>
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed mb-3">
              {entry.response}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {!entry.saved && (
                <button
                  onClick={() => saveEntry(entry.id)}
                  className="px-3 py-1 rounded-md text-[12px] font-medium text-primary border border-primary/30 hover:bg-primary/10 transition-colors duration-150 active:scale-[0.97]"
                >
                  DB 저장
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DB log */}
      {savedEntries.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[13px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            누적 인사이트 DB
          </h3>
          <div className="space-y-1">
            {savedEntries.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-secondary/50 transition-colors duration-150"
              >
                <span className="font-mono text-[12px] text-primary w-8">
                  #{i + 1}
                </span>
                <span className="text-[12px] font-mono text-muted-foreground w-20">
                  {entry.date}
                </span>
                <span className="text-[13px] text-foreground truncate flex-1">
                  {entry.response.slice(0, 80)}...
                </span>
                <div className="flex gap-1">
                  {entry.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[9px] bg-secondary text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
