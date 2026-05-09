import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useMantra } from "@/lib/mantra-context";

export default function MantraTicker() {
  const { affirmations, openReader } = useMantra();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Prefer favorites if any
  const pool = affirmations.some((a) => a.is_favorite)
    ? affirmations.filter((a) => a.is_favorite)
    : affirmations;

  useEffect(() => {
    if (pool.length <= 1 || paused) return;
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % pool.length), 8000);
    return () => window.clearTimeout(t);
  }, [idx, pool.length, paused]);

  useEffect(() => {
    if (idx >= pool.length) setIdx(0);
  }, [pool.length, idx]);

  if (pool.length === 0) return null;
  const current = pool[idx % pool.length];
  const fullIndex = affirmations.findIndex((a) => a.id === current.id);

  return (
    <button
      onClick={() => openReader(Math.max(0, fullIndex))}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="w-full h-9 px-6 border-b border-border bg-card/40 flex items-center justify-center gap-2.5 group shrink-0"
      aria-label="만트라 풀스크린으로 읽기"
    >
      <Sparkles className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors shrink-0" />
      <span
        key={current.id}
        className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors animate-in fade-in duration-700 truncate"
      >
        {current.text}
      </span>
    </button>
  );
}
