import { useState, useEffect } from "react";
import { loadJSON, saveJSON, type JapaneseExpression } from "@/lib/store";
import { Flame, BookOpen, Target, Lightbulb } from "lucide-react";

const SAMPLE_EXPRESSIONS: JapaneseExpression[] = [
  { id: "1", word: "一石二鳥", reading: "いっせきにちょう", meaning: "일석이조", example: "この方法なら一石二鳥だ。", learned: false, date: "" },
  { id: "2", word: "三日坊主", reading: "みっかぼうず", meaning: "작심삼일", example: "三日坊主にならないように頑張る。", learned: false, date: "" },
  { id: "3", word: "七転八起", reading: "ななころびやおき", meaning: "칠전팔기", example: "七転八起の精神で挑戦し続ける。", learned: false, date: "" },
  { id: "4", word: "以心伝心", reading: "いしんでんしん", meaning: "이심전심", example: "以心伝心で分かり合えた。", learned: false, date: "" },
  { id: "5", word: "自業自得", reading: "じごうじとく", meaning: "자업자득", example: "それは自業自得だよ。", learned: false, date: "" },
  { id: "6", word: "一期一会", reading: "いちごいちえ", meaning: "일기일회, 한 번의 만남을 소중히", example: "一期一会の出会いを大切にする。", learned: false, date: "" },
  { id: "7", word: "温故知新", reading: "おんこちしん", meaning: "온고지신", example: "温故知新の精神で学ぶ。", learned: false, date: "" },
  { id: "8", word: "切磋琢磨", reading: "せっさたくま", meaning: "절차탁마, 서로 갈고닦음", example: "仲間と切磋琢磨する。", learned: false, date: "" },
];

const DAILY_GOAL = 8;

export default function JapanesePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [expressions, setExpressions] = useState<JapaneseExpression[]>(() =>
    loadJSON("jp_expressions", SAMPLE_EXPRESSIONS)
  );
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    saveJSON("jp_expressions", expressions);
  }, [expressions]);

  const todayLearned = expressions.filter((e) => e.date === today && e.learned);
  const totalLearned = expressions.filter((e) => e.learned);
  const current = expressions[currentIdx];

  const markLearned = () => {
    setExpressions((prev) =>
      prev.map((e, i) =>
        i === currentIdx ? { ...e, learned: true, date: today } : e
      )
    );
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 stagger-children">
        {[
          { label: "연속 학습", value: "7일", icon: Flame },
          { label: "전체 표현", value: totalLearned.length, icon: BookOpen },
          { label: "오늘 학습", value: `${todayLearned.length} / ${DAILY_GOAL}`, icon: Target },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                {s.label}
              </span>
            </div>
            <span className="text-xl font-mono font-medium text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] text-muted-foreground mr-2">오늘 진행</span>
        {Array.from({ length: DAILY_GOAL }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < todayLearned.length
                ? "bg-primary"
                : i === todayLearned.length
                ? "bg-primary/40 animate-pulse-amber"
                : "bg-secondary"
            }`}
          />
        ))}
        <span className="text-[11px] font-mono text-muted-foreground ml-2">
          {todayLearned.length}/{DAILY_GOAL}
        </span>
      </div>

      {/* Expression card */}
      {current && (
        <div className="bg-card rounded-lg border border-border p-8 mb-6 text-center animate-fade-up">
          <p className="text-4xl font-medium text-foreground mb-2 leading-tight" style={{ lineHeight: 1.2 }}>
            {current.word}
          </p>
          <p className="text-lg text-primary mb-1 font-mono">{current.reading}</p>
          <p className="text-base text-muted-foreground mb-6">{current.meaning}</p>
          <div className="bg-secondary/50 rounded-md p-3 mb-6 inline-block">
            <p className="text-sm text-foreground">{current.example}</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={nextExpression}
              className="px-4 py-2 rounded-md text-[13px] font-medium text-muted-foreground border border-border hover:bg-secondary transition-colors duration-150 active:scale-[0.97]"
            >
              다음 표현
            </button>
            <button
              onClick={skipForNow}
              className="px-4 py-2 rounded-md text-[13px] font-medium text-foreground border border-border hover:bg-secondary transition-colors duration-150 active:scale-[0.97]"
            >
              다시볼게요
            </button>
            <button
              onClick={markLearned}
              className="px-4 py-2 rounded-md text-[13px] font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all duration-150 active:scale-[0.97]"
            >
              외웠어요 ✓
            </button>
          </div>
        </div>
      )}

      {/* AI learning tip */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="text-[13px] font-medium text-foreground">AI 학습 팁</span>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          오늘의 표현 "{current?.word}"는 사자성어입니다. 일상 대화보다 비즈니스나 글쓰기에서 자주 사용됩니다.
          비슷한 표현으로 다음 학습에서는 관련 표현을 추천드릴게요.
        </p>
      </div>

      {/* History */}
      {totalLearned.length > 0 && (
        <div>
          <h3 className="text-[13px] font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            학습 히스토리
          </h3>
          <div className="space-y-1">
            {totalLearned.map((expr) => (
              <div
                key={expr.id}
                className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-secondary/50 transition-colors duration-150"
              >
                <span className="text-base text-foreground w-24">{expr.word}</span>
                <span className="text-[12px] font-mono text-primary">{expr.reading}</span>
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
