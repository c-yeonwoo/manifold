import { useState } from "react";
import { Building2, MapPin, Calendar, AlertCircle } from "lucide-react";

const FILTERS = ["전체", "관심조건", "청약예정", "접수중", "마감"];

interface Listing {
  id: string;
  name: string;
  region: string;
  type: "경매" | "청약" | "급매";
  units: number;
  startDate: string;
  endDate: string;
  isNew: boolean;
}

const SAMPLE_LISTINGS: Listing[] = [
  { id: "1", name: "래미안 원베일리", region: "서울 서초구", type: "청약", units: 2990, startDate: "2025-02-01", endDate: "2025-02-15", isNew: true },
  { id: "2", name: "디에이치 아너힐즈", region: "서울 강남구", type: "청약", units: 1230, startDate: "2025-02-10", endDate: "2025-02-20", isNew: true },
  { id: "3", name: "힐스테이트 세운", region: "서울 중구", type: "급매", units: 480, startDate: "2025-01-20", endDate: "2025-03-01", isNew: false },
  { id: "4", name: "경매 #2025-1234", region: "경기 성남시", type: "경매", units: 1, startDate: "2025-02-05", endDate: "2025-02-05", isNew: false },
];

const REGIONS = ["서울 강남구", "서울 서초구", "서울 송파구", "서울 중구", "경기 성남시", "경기 하남시"];

export default function PropertyPage() {
  const [filter, setFilter] = useState("전체");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const filteredListings = SAMPLE_LISTINGS.filter((l) => {
    if (filter !== "전체") {
      if (filter === "청약예정" && l.type !== "청약") return false;
      if (filter === "접수중" && new Date(l.endDate) < new Date()) return false;
    }
    if (selectedRegions.length > 0 && !selectedRegions.includes(l.region)) return false;
    return true;
  });

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const getDDay = (endDate: string) => {
    const diff = Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  return (
    <div className="flex gap-6 animate-fade-up">
      <div className="flex-1 max-w-3xl">
        {/* Filter bar */}
        <div className="flex gap-1 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 active:scale-[0.97] ${
                filter === f
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="space-y-3 stagger-children">
          {filteredListings.map((listing) => {
            const dDay = getDDay(listing.endDate);
            const dDayPct = Math.max(0, Math.min(100, ((30 - Math.abs(dDay)) / 30) * 100));

            return (
              <div
                key={listing.id}
                className="bg-card rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[15px] font-medium text-foreground">
                        {listing.name}
                      </h3>
                      {listing.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/20 text-destructive uppercase">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {listing.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {listing.units}세대
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      listing.type === "청약"
                        ? "bg-primary/15 text-primary"
                        : listing.type === "경매"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {listing.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {listing.startDate} ~ {listing.endDate}
                  </div>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dDay <= 3 ? "bg-destructive" : dDay <= 7 ? "bg-primary" : "bg-success"
                      }`}
                      style={{ width: `${dDayPct}%` }}
                    />
                  </div>
                  <span className={`text-[12px] font-mono ${dDay <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
                    D{dDay > 0 ? `-${dDay}` : dDay === 0 ? "-Day" : `+${Math.abs(dDay)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-56 space-y-4 stagger-children">
        {/* Region filter */}
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-3">
            지역 필터
          </span>
          <div className="space-y-1.5">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={`flex items-center gap-2 w-full text-left py-1 text-[12px] transition-colors duration-150 ${
                  selectedRegions.includes(r) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                    selectedRegions.includes(r) ? "border-primary bg-primary/20" : "border-border"
                  }`}
                >
                  {selectedRegions.includes(r) && (
                    <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* AI insight */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
              시장 시그널
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            관심 조건을 설정하면 AI가 시장 분위기와 경제 인사이트를 교차 분석합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
