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
  actions: ActionItem[];
}

export interface GoalLog {
  goalId: string;
  date: string;
  checkedActionIds: string[];
  note: string;
}

const GOALS_KEY = "goals_v1";

export function loadGoals(): Goal[] {
  return loadJSON<Goal[]>(GOALS_KEY, []);
}
export function saveGoals(goals: Goal[]) {
  saveJSON(GOALS_KEY, goals);
  window.dispatchEvent(new Event("goals-updated"));
}
export function goalsByCategory(category: CategoryKey): Goal[] {
  return loadGoals().filter((g) => g.category === category);
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
export function deleteGoal(id: string) {
  saveGoals(loadGoals().filter((g) => g.id !== id));
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function logKey(goalId: string, date: string) {
  return `goal_log_${goalId}_${date}`;
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
  const prefix = `goal_log_${goalId}_`;
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
