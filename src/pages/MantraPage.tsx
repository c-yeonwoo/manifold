import { Play, Sparkles } from "lucide-react";
import { useMantra } from "@/lib/mantra-context";
import MantraList from "@/components/mantra/MantraList";

export default function MantraPage() {
  const { affirmations, openReader } = useMantra();
  const favCount = affirmations.filter((a) => a.is_favorite).length;

  return (
    <div className="max-w-3xl mx-auto py-2">
      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-xl font-medium tracking-tight">내 만트라</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            소리내어 읽고, 매일 새겨두는 한 줄들. 단축키 <span className="font-mono text-foreground/70">M</span>으로 언제든 풀스크린 진입.
          </p>
        </div>
        <button
          onClick={() => openReader(0)}
          disabled={affirmations.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Play className="w-3.5 h-3.5" fill="currentColor" />
          풀스크린 읽기
        </button>
      </header>

      {affirmations.length > 0 && (
        <div className="flex gap-4 mb-4 text-[11px] font-mono text-muted-foreground">
          <span>총 <span className="text-foreground">{affirmations.length}</span></span>
          <span>즐겨찾기 <span className="text-primary">{favCount}</span></span>
        </div>
      )}

      <MantraList />
    </div>
  );
}
