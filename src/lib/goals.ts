import { loadJSON, saveJSON } from "./store";

export type CategoryKey = "health" | "wealth" | "work" | "love" | "growth" | "play";

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  mantra: string;
  hue: number; // for hsl accent
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
  completedAt?: string; // ISO timestamp when the goal was achieved
  actions: ActionItem[];
}

export interface GoalLog {
  goalId: string;
  date: string;
  checkedActionIds: string[];
  note: string;
}

// ---- User-scoped storage ----
// Goals & logs were originally stored under fixed keys, which caused data
// from previous sessions/users to "leak" across logins on the same browser.
// We now scope every key by the current user id (set by AuthProvider).
let CURRENT_USER_ID: string | null = null;

export function setGoalsUserScope(userId: string | null) {
  if (CURRENT_USER_ID === userId) return;
  CURRENT_USER_ID = userId;
  window.dispatchEvent(new Event("goals-updated"));
}

const goalsKey = () =>
  CURRENT_USER_ID ? `goals_v1__${CURRENT_USER_ID}` : `goals_v1__guest`;

export function loadGoals(): Goal[] {
  return loadJSON<Goal[]>(goalsKey(), []);
}
export function saveGoals(goals: Goal[]) {
  saveJSON(goalsKey(), goals);
  window.dispatchEvent(new Event("goals-updated"));
}
export function goalsByCategory(category: CategoryKey, opts: { includeCompleted?: boolean } = {}): Goal[] {
  return loadGoals().filter(
    (g) => g.category === category && (opts.includeCompleted ? true : !g.completedAt)
  );
}
export function activeGoalsByCategory(category: CategoryKey): Goal[] {
  return loadGoals().filter((g) => g.category === category && !g.completedAt);
}
export function completedGoalsByCategory(category: CategoryKey): Goal[] {
  return loadGoals()
    .filter((g) => g.category === category && !!g.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
}
export function getGoal(id: string): Goal | undefined {
  return loadGoals().find((g) => g.id === id);
}
export function upsertGoal(goal: Goal) {
  const all = loadGoals();
  const idx = all.findIndex((g) => g.id === goal.id);
  if (idx >= 0) all[idx] = goal;
  else all.push(goal);
  saveGoals(all);
}
export function completeGoal(id: string) {
  const all = loadGoals();
  const g = all.find((x) => x.id === id);
  if (!g) return;
  g.completedAt = new Date().toISOString();
  saveGoals(all);
}
export function reopenGoal(id: string) {
  const all = loadGoals();
  const g = all.find((x) => x.id === id);
  if (!g) return;
  delete g.completedAt;
  saveGoals(all);
}
export function deleteGoal(id: string) {
  saveGoals(loadGoals().filter((g) => g.id !== id));
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function logKey(goalId: string, date: string) {
  const scope = CURRENT_USER_ID ?? "guest";
  return `goal_log__${scope}__${goalId}__${date}`;
}
export function loadLog(goalId: string, date: string): GoalLog {
  return loadJSON<GoalLog>(logKey(goalId, date), {
    goalId,
    date,
    checkedActionIds: [],
    note: "",
  });
}
export function saveLog(log: GoalLog) {
  saveJSON(logKey(log.goalId, log.date), log);
  window.dispatchEvent(new Event("goals-updated"));
}

export function listLogs(goalId: string): GoalLog[] {
  const logs: GoalLog[] = [];
  const scope = CURRENT_USER_ID ?? "guest";
  const prefix = `goal_log__${scope}__${goalId}__`;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      try {
        logs.push(JSON.parse(localStorage.getItem(k)!));
      } catch {}
    }
  }
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

export function todayProgress(goal: Goal): { done: number; total: number } {
  const log = loadLog(goal.id, todayStr());
  return { done: log.checkedActionIds.length, total: goal.actions.length };
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ---- Life Vision (one-line top vision) ----
const lifeVisionKey = () =>
  CURRENT_USER_ID ? `life_vision__${CURRENT_USER_ID}` : `life_vision__guest`;

export function loadLifeVision(): string {
  return loadJSON<string>(lifeVisionKey(), "");
}
export function saveLifeVision(text: string) {
  saveJSON(lifeVisionKey(), text);
  window.dispatchEvent(new Event("goals-updated"));
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
