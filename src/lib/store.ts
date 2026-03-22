// localStorage-backed store utilities

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Routine items
export interface RoutineItem {
  id: string;
  label: string;
  phase: 1 | 2 | 3;
  done: boolean;
}

export const DEFAULT_ROUTINES: RoutineItem[] = [
  { id: "wake", label: "기상 & 운동", phase: 1, done: false },
  { id: "shower", label: "찬물 샤워", phase: 1, done: false },
  { id: "protein", label: "프로틴 & 영양제", phase: 1, done: false },
  { id: "read", label: "독서 30분", phase: 1, done: false },
  { id: "japanese", label: "일본어", phase: 1, done: false },
  { id: "economy", label: "경제 공부", phase: 1, done: false },
  { id: "work", label: "회사 업무", phase: 2, done: false },
  { id: "gym", label: "헬스", phase: 3, done: false },
  { id: "expense", label: "지출 기록", phase: 3, done: false },
  { id: "proteinLog", label: "단백질 기록", phase: 3, done: false },
  { id: "review", label: "하루 점검", phase: 3, done: false },
];

export function getTodayKey(prefix: string): string {
  const d = new Date();
  return `${prefix}_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Economy insights
export interface EconomyEntry {
  id: string;
  date: string;
  mode: "paste" | "qa" | "connect";
  input: string;
  response: string;
  tags: string[];
  saved: boolean;
}

// Japanese expressions
export interface JapaneseExpression {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  example: string;
  learned: boolean;
  date: string;
}

// Health
export interface WorkoutLog {
  id: string;
  date: string;
  muscleGroup: string;
  exercises: { name: string; sets: { weight: number; reps: number }[] }[];
}

// Finance
export interface Expense {
  id: string;
  date: string;
  category: string;
  name: string;
  amount: number;
}

// Property
export interface PropertyListing {
  id: string;
  name: string;
  region: string;
  type: "경매" | "청약" | "급매";
  units: number;
  startDate: string;
  endDate: string;
  isNew: boolean;
}

// Daily quotes
export const QUOTES = [
  "작은 습관이 큰 변화를 만든다.",
  "오늘 하루도 성장의 날이다.",
  "꾸준함이 천재를 이긴다.",
  "복리의 마법은 시간에서 온다.",
  "매일 1%씩 나아가면 1년 후 37배.",
  "시작이 반이다. 나머지 반은 꾸준함이다.",
  "지금 이 순간이 가장 빠른 시작점이다.",
];
