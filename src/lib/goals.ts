import { loadJSON, saveJSON } from "./store";
import { supabase } from "@/integrations/supabase/client";

export type CategoryKey = "health" | "wealth" | "work" | "love" | "growth" | "play";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  mantra: string;
  hue: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "health",  label: "Health",  mantra: "나는 건강하고 강하다",       hue: 142 },
  { key: "wealth",  label: "Wealth",  mantra: "풍요는 나에게 흐른다",       hue: 38  },
  { key: "work",    label: "Work",    mantra: "나는 가치를 창조한다",       hue: 210 },
  { key: "love",    label: "Love",    mantra: "사랑은 내 안에 가득하다",   hue: 340 },
  { key: "growth",  label: "Growth",  mantra: "나는 매일 성장한다",         hue: 270 },
  { key: "play",    label: "Play",    mantra: "삶은 즐거운 놀이다",         hue: 25  },
];

export const getCategory = (key: string): CategoryMeta | undefined =>
  CATEGORIES.find((c) => c.key === key);

export interface ActionItem {
  id: string;
  label: string;
}

export interface Goal {
  id: string;
  category: CategoryKey;
  title: string;
  vision: string;
  imageUrl?: string;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  actions: ActionItem[];
}

export interface GoalLog {
  goalId: string;
  date: string;
  checkedActionIds: string[];
  note: string;
}

// =====================================================================
// In-memory cache backed by Supabase (with localStorage fallback for guests)
// The public API stays synchronous so existing components work unchanged.
// All writes are mirrored to Supabase asynchronously (fire-and-forget).
// =====================================================================

let CURRENT_USER_ID: string | null = null;
let GOALS_CACHE: Goal[] = [];
let LOGS_CACHE: Map<string, GoalLog> = new Map(); // key = `${goalId}__${date}`
let LIFE_VISION_CACHE: string = "";
let HYDRATED = false;

const logCacheKey = (goalId: string, date: string) => `${goalId}__${date}`;

const dbRowToGoal = (r: any): Goal => ({
  id: r.id,
  category: r.category as CategoryKey,
  title: r.title,
  vision: r.vision ?? "",
  imageUrl: r.image_url ?? undefined,
  deadline: r.deadline ?? undefined,
  createdAt: r.created_at,
  completedAt: r.completed_at ?? undefined,
  actions: Array.isArray(r.actions) ? (r.actions as ActionItem[]) : [],
});

const goalToDbRow = (g: Goal, userId: string) => ({
  id: g.id,
  user_id: userId,
  category: g.category,
  title: g.title,
  vision: g.vision ?? "",
  image_url: g.imageUrl ?? null,
  deadline: g.deadline ?? null,
  actions: g.actions ?? [],
  completed_at: g.completedAt ?? null,
});

const dbRowToLog = (r: any): GoalLog => ({
  goalId: r.goal_id,
  date: r.log_date,
  checkedActionIds: Array.isArray(r.checked_action_ids) ? r.checked_action_ids : [],
  note: r.note ?? "",
});

// ---- Guest fallback (pre-login, keeps localStorage behavior) ----
const guestGoalsKey = () => `goals_v1__guest`;
const guestLogKey = (goalId: string, date: string) => `goal_log__guest__${goalId}__${date}`;
const guestLifeVisionKey = () => `life_vision__guest`;

function loadGuest() {
  GOALS_CACHE = loadJSON<Goal[]>(guestGoalsKey(), []);
  LOGS_CACHE = new Map();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`goal_log__guest__`)) {
      try {
        const log = JSON.parse(localStorage.getItem(k)!) as GoalLog;
        LOGS_CACHE.set(logCacheKey(log.goalId, log.date), log);
      } catch {}
    }
  }
  LIFE_VISION_CACHE = loadJSON<string>(guestLifeVisionKey(), "");
  HYDRATED = true;
}

async function hydrateFromSupabase(userId: string) {
  HYDRATED = false;
  GOALS_CACHE = [];
  LOGS_CACHE = new Map();
  LIFE_VISION_CACHE = "";

  const [{ data: goals }, { data: logs }, { data: profile }] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("goal_logs").select("*").eq("user_id", userId),
    supabase.from("profiles").select("life_vision").eq("id", userId).maybeSingle(),
  ]);

  GOALS_CACHE = (goals ?? []).map(dbRowToGoal);
  for (const r of logs ?? []) {
    const log = dbRowToLog(r);
    LOGS_CACHE.set(logCacheKey(log.goalId, log.date), log);
  }
  LIFE_VISION_CACHE = (profile as any)?.life_vision ?? "";
  HYDRATED = true;
  window.dispatchEvent(new Event("goals-updated"));
}

export function setGoalsUserScope(userId: string | null) {
  if (CURRENT_USER_ID === userId && HYDRATED) return;
  CURRENT_USER_ID = userId;
  if (!userId) {
    loadGuest();
    window.dispatchEvent(new Event("goals-updated"));
    return;
  }
  // hydrate async; emits goals-updated when done
  hydrateFromSupabase(userId).catch((e) => {
    console.error("[goals] hydrate failed", e);
    HYDRATED = true;
    window.dispatchEvent(new Event("goals-updated"));
  });
}

// ---- Goals API (sync surface) ----

export function loadGoals(): Goal[] {
  return GOALS_CACHE;
}

export function saveGoals(goals: Goal[]) {
  // Used rarely (bulk replace). For guest only — for authed users prefer upsert/delete.
  GOALS_CACHE = goals;
  if (!CURRENT_USER_ID) saveJSON(guestGoalsKey(), goals);
  window.dispatchEvent(new Event("goals-updated"));
}

export function goalsByCategory(category: CategoryKey, opts: { includeCompleted?: boolean } = {}): Goal[] {
  return GOALS_CACHE.filter(
    (g) => g.category === category && (opts.includeCompleted ? true : !g.completedAt)
  );
}
export function activeGoalsByCategory(category: CategoryKey): Goal[] {
  return GOALS_CACHE.filter((g) => g.category === category && !g.completedAt);
}
export function completedGoalsByCategory(category: CategoryKey): Goal[] {
  return GOALS_CACHE
    .filter((g) => g.category === category && !!g.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}
export function getGoal(id: string): Goal | undefined {
  return GOALS_CACHE.find((g) => g.id === id);
}

export function upsertGoal(goal: Goal) {
  const idx = GOALS_CACHE.findIndex((g) => g.id === goal.id);
  if (idx >= 0) GOALS_CACHE[idx] = goal;
  else GOALS_CACHE.push(goal);
  window.dispatchEvent(new Event("goals-updated"));

  if (CURRENT_USER_ID) {
    supabase
      .from("goals")
      .upsert(goalToDbRow(goal, CURRENT_USER_ID))
      .then(({ error }) => {
        if (error) console.error("[goals] upsert failed", error);
      });
  } else {
    saveJSON(guestGoalsKey(), GOALS_CACHE);
  }
}

export function completeGoal(id: string) {
  const g = GOALS_CACHE.find((x) => x.id === id);
  if (!g) return;
  g.completedAt = new Date().toISOString();
  upsertGoal(g);
}

export function reopenGoal(id: string) {
  const g = GOALS_CACHE.find((x) => x.id === id);
  if (!g) return;
  delete g.completedAt;
  if (CURRENT_USER_ID) {
    supabase
      .from("goals")
      .update({ completed_at: null })
      .eq("id", id)
      .then(({ error }) => error && console.error("[goals] reopen failed", error));
  } else {
    saveJSON(guestGoalsKey(), GOALS_CACHE);
  }
  window.dispatchEvent(new Event("goals-updated"));
}

export function deleteGoal(id: string) {
  GOALS_CACHE = GOALS_CACHE.filter((g) => g.id !== id);
  // Also drop logs for that goal in cache
  for (const k of Array.from(LOGS_CACHE.keys())) {
    if (k.startsWith(`${id}__`)) LOGS_CACHE.delete(k);
  }
  window.dispatchEvent(new Event("goals-updated"));

  if (CURRENT_USER_ID) {
    supabase.from("goals").delete().eq("id", id).then(({ error }) => {
      if (error) console.error("[goals] delete failed", error);
    });
    supabase.from("goal_logs").delete().eq("goal_id", id).then(() => {});
  } else {
    saveJSON(guestGoalsKey(), GOALS_CACHE);
  }
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ---- Logs ----

export function logKey(goalId: string, date: string) {
  // Kept for backwards-compat with any external callers; not used internally now.
  const scope = CURRENT_USER_ID ?? "guest";
  return `goal_log__${scope}__${goalId}__${date}`;
}

export function loadLog(goalId: string, date: string): GoalLog {
  const cached = LOGS_CACHE.get(logCacheKey(goalId, date));
  if (cached) return cached;
  return { goalId, date, checkedActionIds: [], note: "" };
}

export function saveLog(log: GoalLog) {
  LOGS_CACHE.set(logCacheKey(log.goalId, log.date), log);
  window.dispatchEvent(new Event("goals-updated"));

  if (CURRENT_USER_ID) {
    supabase
      .from("goal_logs")
      .upsert(
        {
          user_id: CURRENT_USER_ID,
          goal_id: log.goalId,
          log_date: log.date,
          checked_action_ids: log.checkedActionIds,
          note: log.note,
        },
        { onConflict: "user_id,goal_id,log_date" }
      )
      .then(({ error }) => {
        if (error) console.error("[goal_logs] upsert failed", error);
      });
  } else {
    saveJSON(guestLogKey(log.goalId, log.date), log);
  }
}

export function listLogs(goalId: string): GoalLog[] {
  const out: GoalLog[] = [];
  for (const [k, v] of LOGS_CACHE) {
    if (k.startsWith(`${goalId}__`)) out.push(v);
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function todayProgress(goal: Goal): { done: number; total: number } {
  const log = loadLog(goal.id, todayStr());
  return { done: log.checkedActionIds.length, total: goal.actions.length };
}

export function uid() {
  // Use real UUIDs so goal ids are valid in Supabase (goal_logs.goal_id is uuid).
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

// ---- Life Vision ----

export function loadLifeVision(): string {
  return LIFE_VISION_CACHE;
}

export function saveLifeVision(text: string) {
  LIFE_VISION_CACHE = text;
  window.dispatchEvent(new Event("goals-updated"));

  if (CURRENT_USER_ID) {
    supabase
      .from("profiles")
      .update({ life_vision: text })
      .eq("id", CURRENT_USER_ID)
      .then(({ error }) => {
        if (error) console.error("[life_vision] update failed", error);
      });
  } else {
    saveJSON(guestLifeVisionKey(), text);
  }
}

// ---- Quarter helpers ----
export function quarterOf(d: Date): { year: number; q: 1 | 2 | 3 | 4 } {
  return { year: d.getFullYear(), q: (Math.floor(d.getMonth() / 3) + 1) as 1 | 2 | 3 | 4 };
}
export function quarterRange(year: number, q: 1 | 2 | 3 | 4): { start: Date; end: Date } {
  const startMonth = (q - 1) * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 1),
  };
}
export function quarterLabel(year: number, q: number) {
  return `${year} Q${q}`;
}
