import { useEffect, useState, useSyncExternalStore } from "react";
import { loadLifeVision, saveLifeVision } from "@/lib/goals";
import { Pencil, Check, X } from "lucide-react";

const DEFAULT_VISION = "원하는 건 무엇이든 이뤄진다";

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
  const display = stored || DEFAULT_VISION;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    if (!editing) setDraft(stored);
  }, [stored, editing]);

  const save = () => {
    saveLifeVision(draft.trim());
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto mb-2 flex items-center justify-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder={DEFAULT_VISION}
          className="flex-1 bg-transparent text-center text-xl font-medium text-foreground outline-none border-b border-primary/40 focus:border-primary py-1"
        />
        <button onClick={save} className="text-primary hover:text-primary/80">
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="group inline-flex items-center gap-2 cursor-text mx-auto"
      title="클릭해서 나만의 한 줄 비전으로 바꾸기"
    >
      <h1 className="text-xl font-medium text-foreground">{display}</h1>
      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
