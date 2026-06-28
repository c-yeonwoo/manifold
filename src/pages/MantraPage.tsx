import { useState } from "react";
import { Play, Sparkles, List, BookOpen, Star } from "lucide-react";
import { useMantra } from "@/lib/mantra-context";
import MantraList from "@/components/mantra/MantraList";

export default function MantraPage() {
  const { affirmations, openReader } = useMantra();
  const [mode, setMode] = useState<"edit" | "read">("edit");
  const [favOnly, setFavOnly] = useState(false);
  const favCount = affirmations.filter((a) => a.is_favorite).length;

  const readItems = favOnly ? affirmations.filter((a) => a.is_favorite) : affirmations;

  return (
    <div className="max-w-3xl mx-auto py-2">
      <header className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-xl font-medium tracking-tight">내 문장들</h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            확언 · 명언 · 다짐 — 생각날 때마다 한 줄씩 쌓아 정체성을 만들어요. 단축키{" "}
            <span className="font-mono text-foreground/70">M</span>으로 풀스크린, 아래에서 직접 읽어도 좋아요.
          </p>
        </div>
        <button
          onClick={() => openReader(0)}
          disabled={affirmations.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Play className="w-3.5 h-3.5" fill="currentColor" />
          풀스크린
        </button>
      </header>

      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex rounded-lg border border-border bg-card/40 p-0.5">
          <button
            onClick={() => setMode("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === "edit" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            편집
          </button>
          <button
            onClick={() => setMode("read")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === "read" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            읽기
          </button>
        </div>

        {affirmations.length > 0 && (
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            <span>
              총 <span className="text-foreground">{affirmations.length}</span>
            </span>
            {mode === "read" && favCount > 0 && (
              <button
                onClick={() => setFavOnly((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                  favOnly
                    ? "border-primary/60 text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Star className="w-3 h-3" fill={favOnly ? "currentColor" : "none"} />
                즐겨찾기만 ({favCount})
              </button>
            )}
            {mode === "edit" && (
              <span>
                즐겨찾기 <span className="text-primary">{favCount}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {mode === "edit" ? (
        <MantraList />
      ) : (
        <ReadingView items={readItems} onOpenFullscreen={(i) => openReader(i)} />
      )}
    </div>
  );
}

function ReadingView({
  items,
  onOpenFullscreen,
}: {
  items: { id: string; text: string; is_favorite: boolean }[];
  onOpenFullscreen: (idx: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
        아직 읽을 문장이 없어요. 편집 탭에서 한 줄 추가해보세요.
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {items.map((a, i) => (
        <li
          key={a.id}
          onClick={() => onOpenFullscreen(i)}
          className="group cursor-pointer rounded-xl border border-border bg-card/40 hover:bg-card hover:border-primary/40 transition-all px-6 py-5 flex gap-4 items-start"
        >
          <span className="font-mono text-[11px] text-muted-foreground/60 pt-1.5 w-6 shrink-0 tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p
            className="flex-1 font-serif leading-snug text-foreground/90 group-hover:text-foreground"
            style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.4rem)" }}
          >
            {a.text}
          </p>
          {a.is_favorite && <Star className="w-4 h-4 text-primary shrink-0 mt-1.5" fill="currentColor" />}
        </li>
      ))}
    </ol>
  );
}
