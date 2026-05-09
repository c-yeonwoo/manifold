import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import type { SharedVision, PublicProfile } from "@/lib/community";
import { getCategory } from "@/lib/goals";
import PersonaChip from "./PersonaChip";
import CheerButton from "./CheerButton";

export default function VisionShareCard({
  item,
  profile,
  cheers,
  cheered,
}: {
  item: SharedVision;
  profile?: PublicProfile;
  cheers: number;
  cheered: boolean;
}) {
  const cat = getCategory(item.snapshot.category);
  const accent = cat ? `hsl(${cat.hue} 60% 65%)` : "hsl(var(--primary))";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        {profile ? (
          <Link to={`/u/${profile.handle}`} className="hover:opacity-80">
            <PersonaChip profile={profile} />
          </Link>
        ) : (
          <span className="text-[11px] text-muted-foreground">익명</span>
        )}
        <span className="text-[10px] text-muted-foreground font-mono">
          {item.shared_at.slice(0, 10)}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div
          className="w-1 self-stretch rounded-full"
          style={{ background: accent }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {cat?.label ?? item.snapshot.category}
            </span>
            {item.snapshot.completed && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                <Trophy className="w-3 h-3" /> 달성
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-medium mt-1 truncate">{item.snapshot.title}</h3>
          {item.snapshot.vision && (
            <p className="text-[13px] text-muted-foreground italic mt-1 line-clamp-2">
              "{item.snapshot.vision}"
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <CheerButton
          type="vision"
          id={item.id}
          initialCount={cheers}
          initiallyCheered={cheered}
        />
      </div>
    </div>
  );
}
