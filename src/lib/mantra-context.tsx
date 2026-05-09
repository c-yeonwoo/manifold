import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import { listAffirmations, type Affirmation } from "./affirmations";

interface MantraCtx {
  affirmations: Affirmation[];
  loading: boolean;
  refresh: () => Promise<void>;
  openReader: (startIndex?: number) => void;
  closeReader: () => void;
  readerOpen: boolean;
  readerStartIndex: number;
}

const Ctx = createContext<MantraCtx | null>(null);

export function MantraProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerStartIndex, setReaderStartIndex] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setAffirmations([]);
      return;
    }
    setLoading(true);
    try {
      const list = await listAffirmations();
      setAffirmations(list);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime-ish: refresh on focus
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("affirmations-updated", onFocus);
    return () => window.removeEventListener("affirmations-updated", onFocus);
  }, [refresh]);

  const openReader = useCallback((startIndex = 0) => {
    setReaderStartIndex(startIndex);
    setReaderOpen(true);
  }, []);
  const closeReader = useCallback(() => setReaderOpen(false), []);

  // Global "M" hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (readerOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if ((e.key === "m" || e.key === "M") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (affirmations.length > 0) {
          e.preventDefault();
          openReader(0);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [affirmations.length, openReader, readerOpen]);

  const value = useMemo(
    () => ({ affirmations, loading, refresh, openReader, closeReader, readerOpen, readerStartIndex }),
    [affirmations, loading, refresh, openReader, closeReader, readerOpen, readerStartIndex]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMantra() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMantra must be used within MantraProvider");
  return ctx;
}

export function notifyAffirmationsChanged() {
  window.dispatchEvent(new Event("affirmations-updated"));
}
