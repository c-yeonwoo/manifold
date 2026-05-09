import { useEffect, useState, useSyncExternalStore } from "react";
import { loadLifeVision, saveLifeVision } from "@/lib/goals";
import { Pencil, Check, X, Sparkles } from "lucide-react";

function useTick() {
  return useSyncExternalStore(
    (cb) => {
      const h = () => cb();
      window.addEventListener("goals-updated", h);
      return () => window.removeEventListener("goals-updated", h);
    },
    () => "v"
  );
}

export default function LifeVisionCard() {
  useTick();
  const stored = loadLifeVision();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    if (!editing) setDraft(stored);
  }, [stored, editing]);

  const save = () => {
    saveLifeVision(draft.trim());
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto mb-5 group">
      <div className="relative rounded-xl border border-border/70 bg-card/40 px-5 py-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-3 h-3 text-primary" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Life Vision · 한 줄 인생 비전
          </p>
        </div>

        {editing ? (
          <div className="flex items-start gap-2">
            <textarea
              autoFocus
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
                if (e.key === "Escape") setEditing(false);
              }}
              placeholder="예: 40살에 건강한 몸과 시간 자유를 가진 사람이 된다."
              className="flex-1 bg-transparent text-foreground text-[15px] leading-relaxed resize-none outline-none border-b border-primary/40 focus:border-primary"
            />
            <button onClick={save} className="text-primary hover:text-primary/80 mt-1">
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-muted-foreground hover:text-foreground mt-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="cursor-text min-h-[28px] flex items-center justify-between gap-3"
          >
            <p
              className={`text-[15px] leading-relaxed ${
                stored ? "text-foreground" : "text-muted-foreground italic"
              }`}
            >
              {stored || "한 줄로, 어떤 사람이 되고 싶은지 적어보세요."}
            </p>
            <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}
