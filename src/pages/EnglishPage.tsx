import { useState, useEffect } from "react";
import { loadJSON, saveJSON } from "@/lib/store";
import { Flame, BookOpen, Target, Lightbulb } from "lucide-react";

interface EnglishExpression {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
  learned: boolean;
  date: string;
}

const SAMPLE_EXPRESSIONS: EnglishExpression[] = [
  { id: "1", word: "compound interest", pronunciation: "/ˈkɒmpaʊnd ˈɪntrəst/", meaning: "복리", example: "Compound interest is the eighth wonder of the world.", learned: false, date: "" },
  { id: "2", word: "consistency", pronunciation: "/kənˈsɪstənsi/", meaning: "꾸준함, 일관성", example: "Consistency beats intensity every single time.", learned: false, date: "" },
  { id: "3", word: "leverage", pronunciation: "/ˈlevərɪdʒ/", meaning: "레버리지, 지렛대 효과", example: "You can leverage your skills to build multiple income streams.", learned: false, date: "" },
  { id: "4", word: "diversification", pronunciation: "/daɪˌvɜːrsɪfɪˈkeɪʃn/", meaning: "분산 투자", example: "Diversification reduces overall portfolio risk.", learned: false, date: "" },
  { id: "5", word: "accountability", pronunciation: "/əˌkaʊntəˈbɪlɪti/", meaning: "책임감", example: "Having an accountability partner helps you stay on track.", learned: false, date: "" },
  { id: "6", word: "procrastination", pronunciation: "/prəˌkræstɪˈneɪʃn/", meaning: "미루기, 지연", example: "Procrastination is the thief of time.", learned: false, date: "" },
  { id: "7", word: "resilience", pronunciation: "/rɪˈzɪliəns/", meaning: "회복력, 탄력성", example: "Resilience is what separates those who succeed from those who quit.", learned: false, date: "" },
  { id: "8", word: "paradigm shift", pronunciation: "/ˈpærədaɪm ʃɪft/", meaning: "패러다임 전환", example: "The internet caused a paradigm shift in how we communicate.", learned: false, date: "" },
];

const DAILY_GOAL = 8;

export default function EnglishPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [expressions, setExpressions] = useState<EnglishExpression[]>(() =>
    loadJSON("en_expressions", SAMPLE_EXPRESSIONS)
  );
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => { saveJSON("en_expressions", expressions); }, [expressions]);

  const todayLearned = expressions.filter(e => e.date === today && e.learned);
  const totalLearned = expressions.filter(e => e.learned);
  const current = expressions[currentIdx];

  const markLearned = () => {
    setExpressions(prev => prev.map((e, i) => i === currentIdx ? { ...e, learned: true, date: today } : e));
    if (currentIdx < expressions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const skipForNow = () => {
    if (currentIdx < expressions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const nextExpression = () => {
    if (currentIdx < expressions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        {[
          { label: "연속 학습", value: "7일", icon: Flame },
          { label: "전체 표현", value: totalLearned.length, icon: BookOpen },
          { label: "오늘 학습", value: `${todayLearned.length} / ${DAILY_GOAL}`, icon: Target },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <span className="text-xl font-mono font-medium text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] text-muted-foreground mr-2">오늘 진행</span>
        {Array.from({ length: DAILY_GOAL }).map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            i < todayLearned.length ? "bg-primary" : i === todayLearned.length ? "bg-primary/40 animate-pulse-amber" : "bg-secondary"
          }`} />
        ))}
        <span className="text-[11px] font-mono text-muted-foreground ml-2">{todayLearned.length}/{DAILY_GOAL}</span>
      </div>

      {current && (
        <div className="bg-card rounded-lg border border-border p-8 mb-6 text-center animate-fade-up">
          <p className="text-3xl font-medium text-foreground mb-2" style={{ lineHeight: 1.2 }}>{current.word}</p>
          <p className="text-base text-primary mb-1 font-mono">{current.pronunciation}</p>
          <p className="text-base text-muted-foreground mb-6">{current.meaning}</p>
          <div className="bg-secondary/50 rounded-md p-3 mb-6 inline-block">
            <p className="text-sm text-foreground italic">"{current.example}"</p>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={nextExpression} className="px-4 py-2 rounded-md text-[13px] font-medium text-muted-foreground border border-border hover:bg-secondary transition-colors duration-150 active:scale-[0.97]">
              다음 표현
            </button>
            <button onClick={skipForNow} className="px-4 py-2 rounded-md text-[13px] font-medium text-foreground border border-border hover:bg-secondary transition-colors duration-150 active:scale-[0.97]">
              다시볼게요
            </button>
            <button onClick={markLearned} className="px-4 py-2 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all duration-150 active:scale-[0.97]">
              외웠어요 ✓
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-medium text-foreground">AI 학습 팁</span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          "{current?.word}"는 자기계발/금융 맥락에서 자주 쓰이는 표현입니다. 실제 대화에서 사용해보면 더 빠르게 익힐 수 있어요.
        </p>
      </div>

      {totalLearned.length > 0 && (
        <div>
          <h3 className="text-[13px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">학습 히스토리</h3>
          <div className="space-y-1">
            {totalLearned.map(expr => (
              <div key={expr.id} className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-secondary/50 transition-colors duration-150">
                <span className="text-sm text-foreground w-36">{expr.word}</span>
                <span className="text-[12px] font-mono text-primary">{expr.pronunciation}</span>
                <span className="text-[12px] text-muted-foreground flex-1">{expr.meaning}</span>
                <span className="text-[11px] font-mono text-muted-foreground">{expr.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
