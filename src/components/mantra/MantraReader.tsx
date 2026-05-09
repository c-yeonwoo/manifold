import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { useMantra } from "@/lib/mantra-context";

export default function MantraReader() {
  const { affirmations, readerOpen, readerStartIndex, closeReader } = useMantra();
  const [idx, setIdx] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [readMarked, setReadMarked] = useState<Record<string, boolean>>({});
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (readerOpen) {
      setIdx(Math.min(readerStartIndex, Math.max(0, affirmations.length - 1)));
      setReadMarked({});
      setAutoplay(false);
    }
  }, [readerOpen, readerStartIndex, affirmations.length]);

  const total = affirmations.length;
  const next = () => setIdx((i) => (i + 1) % Math.max(1, total));
  const prev = () => setIdx((i) => (i - 1 + Math.max(1, total)) % Math.max(1, total));

  useEffect(() => {
    if (!readerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeReader();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readerOpen, closeReader]);

  useEffect(() => {
    if (autoplay && readerOpen && total > 1) {
      timerRef.current = window.setTimeout(next, 5000);
      return () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
      };
    }
  }, [autoplay, idx, readerOpen, total]);

  if (!readerOpen) return null;
  const current = affirmations[idx];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      <button
        onClick={closeReader}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
        aria-label="닫기"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center justify-center px-8">
        {current ? (
          <p
            key={current.id}
            className="text-white text-center font-serif leading-tight animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", maxWidth: "min(90vw, 1100px)" }}
          >
            {current.text}
          </p>
        ) : (
          <p className="text-white/40">확언이 없습니다.</p>
        )}
      </div>

      <div className="pb-10 flex flex-col items-center gap-5">
        <div className="font-mono text-white/40 text-sm tracking-widest">
          {total > 0 ? `${idx + 1} / ${total}` : "0 / 0"}
        </div>

        <div className="flex items-center gap-2">
          {affirmations.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "bg-white w-8" : "bg-white/20 hover:bg-white/40 w-1.5"
              }`}
              aria-label={`${i + 1}번 확언`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="p-2.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAutoplay((v) => !v)}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              autoplay
                ? "border-primary/60 text-primary bg-primary/10"
                : "border-white/15 text-white/70 hover:text-white hover:border-white/40"
            }`}
          >
            {autoplay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            자동재생
          </button>
          {current && (
            <button
              onClick={() =>
                setReadMarked((m) => ({ ...m, [current.id]: !m[current.id] }))
              }
              className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                readMarked[current.id]
                  ? "border-success/60 text-success bg-success/10"
                  : "border-white/15 text-white/70 hover:text-white hover:border-white/40"
              }`}
            >
              {readMarked[current.id] ? "✓ 소리내어 읽음" : "소리내어 읽음"}
            </button>
          )}
          <button
            onClick={next}
            className="p-2.5 rounded-full border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-white/25 text-[10px] font-mono tracking-wider">
          ESC 닫기 · ←→ 이동 · 스페이스 다음
        </div>
      </div>
    </div>
  );
}
