import type { PublicProfile } from "@/lib/community";

export default function PersonaChip({ profile }: { profile: PublicProfile | null | undefined }) {
  if (!profile) return null;
  const parts = [profile.persona_age_bucket, profile.persona_role, profile.persona_region].filter(Boolean);
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="font-mono">@{profile.handle}</span>
      {parts.length > 0 && <span className="opacity-60">·</span>}
      {parts.map((p, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded bg-secondary/60">
          {p}
        </span>
      ))}
    </div>
  );
}
