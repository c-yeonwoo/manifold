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

// Daily fallback quotes (shown in the sidebar when no affirmation exists)
export const QUOTES = [
  "작은 습관이 큰 변화를 만든다.",
  "오늘 하루도 성장의 날이다.",
  "꾸준함이 천재를 이긴다.",
  "복리의 마법은 시간에서 온다.",
  "매일 1%씩 나아가면 1년 후 37배.",
  "시작이 반이다. 나머지 반은 꾸준함이다.",
  "지금 이 순간이 가장 빠른 시작점이다.",
];
