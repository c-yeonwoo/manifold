import { loadGoals, getCategory, type CategoryMeta } from "./goals";

/**
 * Look up the category meta for a given goal id (from localStorage goals).
 * Returns undefined if the goal no longer exists.
 */
export function getCategoryForGoal(goalId: string | null | undefined): CategoryMeta | undefined {
  if (!goalId) return undefined;
  const g = loadGoals().find((x) => x.id === goalId);
  if (!g) return undefined;
  return getCategory(g.category);
}
