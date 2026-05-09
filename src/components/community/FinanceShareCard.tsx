import { Link } from "react-router-dom";
import type { SharedFinanceSummary, PublicProfile } from "@/lib/community";
import PersonaChip from "./PersonaChip";
import CheerButton from "./CheerButton";

export default function FinanceShareCard({
  item,
  profile,
  cheers,
  cheered,
}: {
  item: SharedFinanceSummary;
  profile?: PublicProfile;
  cheers: number;
  cheered: boolean;
}) {
  const total = Object.values(item.totals).reduce((s, n) => s + n, 0);
  const sorted = Object.entries(item.totals).sort((a, b) => b[1] - a[1]);
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
          {item.year}.{String(item.month).padStart(2, "0")}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">월 지출</span>
        <span className="text-xl font-mono">{total.toLocaleString()}원</span>
      </div>
      <div className="space-y-1.5">
        {sorted.map(([cat, amt]) => {
          const pct = total > 0 ? (amt / total) * 100 : 0;
          return (
            <div key={cat}>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-foreground">{cat}</span>
                <span className="font-mono text-muted-foreground">
                  {amt.toLocaleString()}원
                </span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {item.note && (
        <p className="text-[12px] text-muted-foreground italic mt-3 border-t border-border pt-2">
          {item.note}
        </p>
      )}
      <div className="mt-3 flex justify-end">
        <CheerButton
          type="finance"
          id={item.id}
          initialCount={cheers}
          initiallyCheered={cheered}
        />
      </div>
    </div>
  );
}
