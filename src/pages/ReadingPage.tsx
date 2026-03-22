import { useState, useEffect } from "react";
import { loadJSON, saveJSON } from "@/lib/store";
import { BookMarked, Lightbulb, Tag } from "lucide-react";

interface BookEntry {
  id: string;
  title: string;
  note: string;
  date: string;
  tags: string[];
  aiInsight: string;
}

export default function ReadingPage() {
  const [books, setBooks] = useState<BookEntry[]>(() => loadJSON("reading_log", []));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    saveJSON("reading_log", books);
  }, [books]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const entry: BookEntry = {
      id: Date.now().toString(),
      title: title.trim(),
      note: note.trim(),
      date: new Date().toISOString().slice(0, 10),
      tags: ["자기계발", "독서"],
      aiInsight: `"${title.trim()}"의 핵심 개념은 기존에 읽은 책들과 연결됩니다. 관련 개념을 확장하면 더 깊은 이해가 가능합니다.`,
    };
    setBooks((prev) => [entry, ...prev]);
    setTitle("");
    setNote("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 stagger-children">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">읽은 책</span>
          </div>
          <span className="text-xl font-mono font-medium text-foreground">{books.length}권</span>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">누적 태그</span>
          </div>
          <span className="text-xl font-mono font-medium text-foreground">
            {new Set(books.flatMap((b) => b.tags)).size}개
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6" onKeyDown={handleKeyDown}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="책 제목"
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm mb-3"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="오늘의 감상을 짧게 적어보세요..."
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed min-h-[80px]"
        />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground">⌘ + Enter로 제출</span>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:brightness-110 transition-all duration-150 active:scale-[0.97] disabled:opacity-40"
          >
            기록 & AI 분석
          </button>
        </div>
      </div>

      {/* Book log */}
      <div className="space-y-3 stagger-children">
        {books.map((book) => (
          <div key={book.id} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono text-muted-foreground">{book.date}</span>
              <h3 className="text-[15px] font-medium text-foreground">{book.title}</h3>
            </div>
            {book.note && (
              <p className="text-[13px] text-muted-foreground mb-3 leading-relaxed">{book.note}</p>
            )}
            <div className="bg-secondary/50 rounded-md p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-3 h-3 text-primary" />
                <span className="text-[11px] font-medium text-primary">AI 인사이트</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{book.aiInsight}</p>
            </div>
            <div className="flex gap-1.5">
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-secondary text-secondary-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
