import { useState, type KeyboardEvent } from "react";
import { Star, Trash2, GripVertical, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMantra, notifyAffirmationsChanged } from "@/lib/mantra-context";
import {
  createAffirmation,
  deleteAffirmation,
  reorderAffirmations,
  updateAffirmation,
  SEED_EXAMPLES,
} from "@/lib/affirmations";
import { CATEGORIES } from "@/lib/goals";
import { toast } from "sonner";

export default function MantraList() {
  const { user } = useAuth();
  const { affirmations, refresh } = useMantra();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const add = async (text: string) => {
    if (!user || !text.trim()) return;
    try {
      await createAffirmation(user.id, text.trim(), affirmations.length);
      setDraft("");
      await refresh();
      notifyAffirmationsChanged();
    } catch (e: any) {
      toast.error(e.message ?? "추가 실패");
    }
  };

  const onDraftKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      add(draft);
    }
  };

  const toggleFav = async (id: string, current: boolean) => {
    await updateAffirmation(id, { is_favorite: !current });
    await refresh();
  };

  const remove = async (id: string) => {
    await deleteAffirmation(id);
    await refresh();
    notifyAffirmationsChanged();
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };
  const commitEdit = async () => {
    if (!editingId) return;
    if (editingText.trim()) {
      await updateAffirmation(editingId, { text: editingText.trim() });
      await refresh();
      notifyAffirmationsChanged();
    }
    setEditingId(null);
  };

  const setCategory = async (id: string, category: string | null) => {
    await updateAffirmation(id, { category });
    await refresh();
  };

  // Drag & drop reorder
  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = affirmations.map((a) => a.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
    const ordered = ids.map((id, position) => ({ id, position }));
    setDragId(null);
    await reorderAffirmations(ordered);
    await refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border border-border rounded-lg bg-card px-3 py-2 focus-within:border-primary/60 transition-colors">
        <span className="text-primary/60 text-sm">+</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onDraftKey}
          placeholder="새 확언 추가… (Cmd+Enter)"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
        />
        <span className="font-mono text-[10px] text-muted-foreground/50">⌘↵</span>
      </div>

      {affirmations.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            아직 확언이 없어요. 예시로 시작해볼까요?
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {SEED_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => add(ex)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:text-primary transition-colors"
              >
                + {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="space-y-1.5">
        {affirmations.map((a, i) => (
          <li
            key={a.id}
            draggable
            onDragStart={() => setDragId(a.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(a.id)}
            className={`group flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-transparent hover:border-border bg-card/40 hover:bg-card transition-colors ${
              dragId === a.id ? "opacity-50" : ""
            }`}
          >
            <span className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground pt-0.5">
              <GripVertical className="w-4 h-4" />
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/60 pt-0.5 w-5 shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              {editingId === a.id ? (
                <input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="w-full bg-transparent outline-none text-sm border-b border-primary/40"
                />
              ) : (
                <button
                  onClick={() => startEdit(a.id, a.text)}
                  className="text-sm text-left w-full hover:text-primary transition-colors"
                >
                  {a.text}
                </button>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                <button
                  onClick={() => setCategory(a.id, null)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    !a.category
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground/30 hover:text-muted-foreground/60"
                  }`}
                >
                  {!a.category && "·"}
                </button>
                {CATEGORIES.map((c) => {
                  const active = a.category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(a.id, active ? null : c.key)}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      #{c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => toggleFav(a.id, a.is_favorite)}
              className={`p-1 transition-colors ${
                a.is_favorite
                  ? "text-primary"
                  : "text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
              }`}
              aria-label="즐겨찾기"
            >
              <Star className="w-4 h-4" fill={a.is_favorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => remove(a.id)}
              className="p-1 text-muted-foreground/30 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
              aria-label="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
