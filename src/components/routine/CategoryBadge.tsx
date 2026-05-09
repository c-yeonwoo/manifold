import { getCategoryForGoal } from "@/lib/category-from-goal";

interface Props {
  goalId: string | null | undefined;
  size?: "sm" | "xs";
}

/**
 * Small inline badge that shows the category for a vision-linked routine item.
 * Uses the category's hue token directly for a subtle colored chip.
 */
export default function CategoryBadge({ goalId, size = "xs" }: Props) {
  const cat = getCategoryForGoal(goalId);
  if (!cat) return null;
  const padding = size === "sm" ? "px-1.5 py-[2px] text-[10px]" : "px-1 py-[1px] text-[9px]";
  return (
    <span
      className={`inline-flex items-center rounded font-medium tracking-wide uppercase ${padding}`}
      style={{
        background: `hsl(${cat.hue} 50% 28% / 0.55)`,
        color: `hsl(${cat.hue} 70% 78%)`,
      }}
    >
      {cat.label}
    </span>
  );
}
