import { useState } from "react";
import { Building2, MapPin, Calendar, AlertCircle, Gavel } from "lucide-react";

const SUBSCRIPTION_FILTERS = ["전체", "청약예정", "접수중", "마감"];
const AUCTION_FILTERS = ["전체", "진행중", "낙찰", "유찰"];

interface Listing {
  id: string;
  name: string;
  region: string;
  type: "청약";
  units: number;
  startDate: string;
  endDate: string;
  isNew: boolean;
}

interface AuctionItem {
  id: string;
  caseNo: string;
  region: string;
  address: string;
  appraisal: number;
  minBid: number;
  auctionDate: string;
  status: "진행중" | "낙찰" | "유찰";
  isNew: boolean;
}

const SAMPLE_LISTINGS: Listing[] = [
  { id: "1", name: "래미안 원베일리", region: "서울 서초구", type: "청약", units: 2990, startDate: "2025-02-01", endDate: "2025-02-15", isNew: true },
  { id: "2", name: "디에이치 아너힐즈", region: "서울 강남구", type: "청약", units: 1230, startDate: "2025-02-10", endDate: "2025-02-20", isNew: true },
  { id: "3", name: "힐스테이트 세운", region: "서울 중구", type: "청약", units: 480, startDate: "2025-01-20", endDate: "2025-03-01", isNew: false },
];

const SAMPLE_AUCTIONS: AuctionItem[] = [
  { id: "a1", caseNo: "2025타경1234", region: "경기 성남시", address: "분당구 정자동 아파트 101동 1502호", appraisal: 850000000, minBid: 595000000, auctionDate: "2025-03-15", status: "진행중", isNew: true },
  { id: "a2", caseNo: "2025타경5678", region: "서울 강남구", address: "역삼동 오피스텔 301호", appraisal: 420000000, minBid: 294000000, auctionDate: "2025-03-20", status: "진행중", isNew: true },
  { id: "a3", caseNo: "2024타경9012", region: "서울 마포구", address: "상암동 아파트 203동 801호", appraisal: 680000000, minBid: 476000000, auctionDate: "2025-02-28", status: "유찰", isNew: false },
  { id: "a4", caseNo: "2024타경3456", region: "경기 하남시", address: "미사동 아파트 502동 1201호", appraisal: 720000000, minBid: 504000000, auctionDate: "2025-02-20", status: "낙찰", isNew: false },
];

const REGIONS = ["서울 강남구", "서울 서초구", "서울 송파구", "서울 중구", "서울 마포구", "경기 성남시", "경기 하남시"];

function formatKrw(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString();
}

export default function PropertyPage() {
  const [tab, setTab] = useState<"청약" | "경매">("청약");
  const [subFilter, setSubFilter] = useState("전체");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const toggleRegion = (r: string) => {
    setSelectedRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const getDDay = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const filters = tab === "청약" ? SUBSCRIPTION_FILTERS : AUCTION_FILTERS;

  const filteredListings = SAMPLE_LISTINGS.filter(l => {
    if (subFilter === "청약예정" && new Date(l.startDate) < new Date()) return false;
    if (subFilter === "접수중" && new Date(l.endDate) < new Date()) return false;
    if (selectedRegions.length > 0 && !selectedRegions.includes(l.region)) return false;
    return true;
  });

  const filteredAuctions = SAMPLE_AUCTIONS.filter(a => {
    if (subFilter !== "전체" && a.status !== subFilter) return false;
    if (selectedRegions.length > 0 && !selectedRegions.includes(a.region)) return false;
    return true;
  });

  return (
    <div className="flex gap-6 animate-fade-up">
      <div className="flex-1 max-w-3xl">
        {/* Tab switcher */}
        <div className="flex gap-1 mb-4 bg-secondary/50 rounded-lg p-1 w-fit">
          {(["청약", "경매"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSubFilter("전체"); }}
              className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 active:scale-[0.97] ${
                tab === t ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "청약" ? "📋 청약" : "⚖️ 경매"}
            </button>
          ))}
        </div>

        {/* Sub filter */}
        <div className="flex gap-1 mb-6">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setSubFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 active:scale-[0.97] ${
                subFilter === f ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "청약" ? (
          <div className="space-y-3 stagger-children">
            {filteredListings.map(listing => {
              const dDay = getDDay(listing.endDate);
              const dDayPct = Math.max(0, Math.min(100, ((30 - Math.abs(dDay)) / 30) * 100));
              return (
                <div key={listing.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-medium text-foreground">{listing.name}</h3>
                        {listing.isNew && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/20 text-destructive uppercase">NEW</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.region}</span>
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {listing.units}세대</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/15 text-primary">청약</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {listing.startDate} ~ {listing.endDate}
                    </div>
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${dDay <= 3 ? "bg-destructive" : dDay <= 7 ? "bg-primary" : "bg-[hsl(var(--success))]"}`} style={{ width: `${dDayPct}%` }} />
                    </div>
                    <span className={`text-[12px] font-mono ${dDay <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
                      D{dDay > 0 ? `-${dDay}` : dDay === 0 ? "-Day" : `+${Math.abs(dDay)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {filteredAuctions.map(auction => {
              const dDay = getDDay(auction.auctionDate);
              const bidRate = Math.round((auction.minBid / auction.appraisal) * 100);
              return (
                <div key={auction.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Gavel className="w-4 h-4 text-blue-400" />
                        <h3 className="text-[14px] font-mono font-medium text-foreground">{auction.caseNo}</h3>
                        {auction.isNew && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-destructive/20 text-destructive uppercase">NEW</span>}
                      </div>
                      <p className="text-[12px] text-muted-foreground ml-6">{auction.address}</p>
                      <div className="flex items-center gap-2 mt-1 ml-6">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="w-3 h-3" />{auction.region}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      auction.status === "진행중" ? "bg-blue-500/15 text-blue-400" :
                      auction.status === "낙찰" ? "bg-[hsl(142_50%_45%/0.15)] text-[hsl(142_50%_45%)]" :
                      "bg-destructive/15 text-destructive"
                    }`}>
                      {auction.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 ml-6">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">감정가</span>
                      <span className="text-[13px] font-mono text-foreground">{formatKrw(auction.appraisal)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">최저가</span>
                      <span className="text-[13px] font-mono text-primary">{formatKrw(auction.minBid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">낙찰가율</span>
                      <span className="text-[13px] font-mono text-foreground">{bidRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 ml-6">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {auction.auctionDate}
                    </span>
                    {auction.status === "진행중" && (
                      <span className={`text-[12px] font-mono ${dDay <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
                        D{dDay > 0 ? `-${dDay}` : dDay === 0 ? "-Day" : `+${Math.abs(dDay)}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-56 space-y-4 stagger-children">
        <div className="bg-card rounded-lg border border-border p-4">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-3">지역 필터</span>
          <div className="space-y-1.5">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => toggleRegion(r)}
                className={`flex items-center gap-2 w-full text-left py-1 text-[12px] transition-colors duration-150 ${
                  selectedRegions.includes(r) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${
                  selectedRegions.includes(r) ? "border-primary bg-primary/20" : "border-border"
                }`}>
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
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">시장 시그널</span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {tab === "청약" 
              ? "관심 조건을 설정하면 AI가 청약 경쟁률과 시장 분위기를 분석합니다."
              : "경매 물건의 감정가 대비 낙찰가율 추이를 AI가 분석합니다."}
          </p>
        </div>
      </div>
    </div>
  );
}
