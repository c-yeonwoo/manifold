import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./auth";
import {
  getActiveTemplate,
  getLogForDate,
  toggleRoutineItem as toggleApi,
  type RoutineTemplate,
  type RoutineTemplateItem,
} from "./routines";
import { todayStr } from "./goals";

interface RoutineCtx {
  template: RoutineTemplate | null;
  items: RoutineTemplateItem[];
  checkedIds: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggle: (item: RoutineTemplateItem) => Promise<void>;
}

const Ctx = createContext<RoutineCtx | null>(null);

export function RoutineProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [template, setTemplate] = useState<RoutineTemplate | null>(null);
  const [items, setItems] = useState<RoutineTemplateItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setTemplate(null);
      setItems([]);
      setCheckedIds([]);
      return;
    }
    setLoading(true);
    try {
      const { template: t, items: it } = await getActiveTemplate(user.id);
      setTemplate(t);
      setItems(it);
      const log = await getLogForDate(user.id, todayStr());
      setCheckedIds(log?.checked_item_ids ?? []);
    } catch (err) {
      console.error("[routine] refresh failed", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUpdate = () => refresh();
    window.addEventListener("routine-template-updated", onUpdate);
    return () => window.removeEventListener("routine-template-updated", onUpdate);
  }, [refresh]);

  const toggle = useCallback(
    async (item: RoutineTemplateItem) => {
      if (!user || !template) return;
      // optimistic
      const isOn = checkedIds.includes(item.id);
      const optimistic = isOn ? checkedIds.filter((id) => id !== item.id) : [...checkedIds, item.id];
      setCheckedIds(optimistic);
      try {
        const next = await toggleApi({
          userId: user.id,
          templateId: template.id,
          item,
          currentChecked: checkedIds,
        });
        setCheckedIds(next);
      } catch (err) {
        console.error("[routine] toggle failed", err);
        setCheckedIds(checkedIds); // revert
      }
    },
    [user, template, checkedIds]
  );

  const value = useMemo(
    () => ({ template, items, checkedIds, loading, refresh, toggle }),
    [template, items, checkedIds, loading, refresh, toggle]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRoutine() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRoutine must be used within RoutineProvider");
  return ctx;
}

export function notifyRoutineTemplateChanged() {
  window.dispatchEvent(new Event("routine-template-updated"));
}
