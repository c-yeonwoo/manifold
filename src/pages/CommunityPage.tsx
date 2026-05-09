import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  feedVisions,
  feedFinance,
  getProfilesByIds,
  cheerCounts,
  myCheers,
  type SharedVision,
  type SharedFinanceSummary,
  type PublicProfile,
} from "@/lib/community";
import { streakOf } from "@/lib/streak";
import {
  listChallenges,
  createChallenge,
  joinChallenge,
  leaveChallenge,
  myJoinedIds,
  type Challenge,
} from "@/lib/challenges";
import {
  myPairs,
  createInvite,
  acceptInvite,
  endPair,
  type Pair,
} from "@/lib/pairs";
import VisionShareCard from "@/components/community/VisionShareCard";
import FinanceShareCard from "@/components/community/FinanceShareCard";
import PersonaChip from "@/components/community/PersonaChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Flame, Plus, Users, Copy } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Community</p>
        <h1 className="text-2xl font-medium mt-1">함께 갓생</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          익명으로 자신의 비전·지출·streak를 공유하고 서로 응원해요. ·{" "}
          <Link to="/settings/profile" className="text-primary hover:underline">
            공개 프로필 설정
          </Link>
        </p>
      </div>
      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">피드</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
          <TabsTrigger value="challenges">챌린지</TabsTrigger>
          <TabsTrigger value="pairs">페어</TabsTrigger>
        </TabsList>
        <TabsContent value="feed">
          <FeedTab />
        </TabsContent>
        <TabsContent value="streak">
          <StreakTab />
        </TabsContent>
        <TabsContent value="challenges">
          <ChallengesTab />
        </TabsContent>
        <TabsContent value="pairs">
          <PairsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeedTab() {
  const [visions, setVisions] = useState<SharedVision[]>([]);
  const [finance, setFinance] = useState<SharedFinanceSummary[]>([]);
  const [profiles, setProfiles] = useState<Map<string, PublicProfile>>(new Map());
  const [vCheers, setVCheers] = useState<Map<string, number>>(new Map());
  const [fCheers, setFCheers] = useState<Map<string, number>>(new Map());
  const [vMine, setVMine] = useState<Set<string>>(new Set());
  const [fMine, setFMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [v, f] = await Promise.all([feedVisions(), feedFinance()]);
      setVisions(v);
      setFinance(f);
      const ids = [...v.map((x) => x.user_id), ...f.map((x) => x.user_id)];
      const [profs, vc, fc, vm, fm] = await Promise.all([
        getProfilesByIds(ids),
        cheerCounts("vision", v.map((x) => x.id)),
        cheerCounts("finance", f.map((x) => x.id)),
        myCheers("vision", v.map((x) => x.id)),
        myCheers("finance", f.map((x) => x.id)),
      ]);
      setProfiles(profs);
      setVCheers(vc);
      setFCheers(fc);
      setVMine(vm);
      setFMine(fm);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground py-8">불러오는 중…</p>;
  if (!visions.length && !finance.length)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        아직 공유된 카드가 없어요. 첫 비전 / 월말 지출을 공유해보세요.
      </p>
    );

  // interleave by date desc
  const all: Array<{ kind: "v"; v: SharedVision } | { kind: "f"; f: SharedFinanceSummary }> = [
    ...visions.map((v) => ({ kind: "v" as const, v })),
    ...finance.map((f) => ({ kind: "f" as const, f })),
  ].sort((a, b) => {
    const da = a.kind === "v" ? a.v.shared_at : a.f.shared_at;
    const db = b.kind === "v" ? b.v.shared_at : b.f.shared_at;
    return db.localeCompare(da);
  });

  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-4">
      {all.map((it) =>
        it.kind === "v" ? (
          <VisionShareCard
            key={"v_" + it.v.id}
            item={it.v}
            profile={profiles.get(it.v.user_id)}
            cheers={vCheers.get(it.v.id) ?? 0}
            cheered={vMine.has(it.v.id)}
          />
        ) : (
          <FinanceShareCard
            key={"f_" + it.f.id}
            item={it.f}
            profile={profiles.get(it.f.user_id)}
            cheers={fCheers.get(it.f.id) ?? 0}
            cheered={fMine.has(it.f.id)}
          />
        )
      )}
    </div>
  );
}

function StreakTab() {
  const [rows, setRows] = useState<Array<{ profile: PublicProfile; streak: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profs = await getProfilesByIds([]); // unused
      // fetch all public profiles
      const { data } = await import("@/integrations/supabase/client").then((m) =>
        m.supabase.from("profiles").select("*").eq("is_public", true).limit(100)
      );
      const list = (data ?? []) as PublicProfile[];
      const withStreak = await Promise.all(
        list.map(async (p) => ({ profile: p, streak: await streakOf(p.id) }))
      );
      withStreak.sort((a, b) => b.streak - a.streak);
      setRows(withStreak);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground py-8">불러오는 중…</p>;
  if (!rows.length)
    return <p className="text-sm text-muted-foreground py-8 text-center">공개 사용자가 아직 없어요.</p>;

  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border mt-4">
      {rows.map((r, i) => (
        <Link
          key={r.profile.id}
          to={`/u/${r.profile.handle}`}
          className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-muted-foreground w-6 text-right">
              {i + 1}
            </span>
            <PersonaChip profile={r.profile} />
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[14px] text-foreground">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> {r.streak}일
          </span>
        </Link>
      ))}
    </div>
  );
}

function ChallengesTab() {
  const [list, setList] = useState<Challenge[]>([]);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(21);

  const refresh = async () => {
    const [c, j] = await Promise.all([listChallenges(), myJoinedIds()]);
    setList(c);
    setJoined(j);
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    if (!title.trim()) return;
    try {
      await createChallenge({ title: title.trim(), days });
      setTitle("");
      setDays(21);
      setCreating(false);
      toast.success("챌린지가 시작됐어요");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-end">
        {!creating ? (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> 챌린지 만들기
          </Button>
        ) : (
          <div className="rounded-lg border border-border bg-card p-3 flex gap-2 w-full">
            <Input
              placeholder="챌린지 제목 (예: 미라클모닝 21일)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 21)}
              className="w-20"
            />
            <Button size="sm" onClick={create}>시작</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              취소
            </Button>
          </div>
        )}
      </div>
      {!list.length && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          아직 챌린지가 없어요. 첫 챌린지를 만들어보세요.
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-card p-4">
            <h4 className="font-medium">{c.title}</h4>
            <p className="text-[11px] text-muted-foreground font-mono mt-1">
              {c.starts_at} → {c.ends_at} · {c.days}일
            </p>
            {c.description && (
              <p className="text-[13px] text-muted-foreground mt-2">{c.description}</p>
            )}
            <div className="mt-3 flex justify-end">
              {joined.has(c.id) ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await leaveChallenge(c.id);
                    refresh();
                  }}
                >
                  나가기
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await joinChallenge(c.id);
                      toast.success("참여했어요");
                      refresh();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                >
                  참여
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PairsTab() {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [code, setCode] = useState("");
  const [profiles, setProfiles] = useState<Map<string, PublicProfile>>(new Map());

  const refresh = async () => {
    const list = await myPairs();
    setPairs(list);
    const ids = list.flatMap((p) => [p.a_user_id, p.b_user_id].filter(Boolean) as string[]);
    setProfiles(await getProfilesByIds(ids));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4 mt-4">
      <div className="rounded-lg border border-border bg-card p-4 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={async () => {
            try {
              const p = await createInvite();
              await navigator.clipboard.writeText(p.invite_code);
              toast.success(`초대코드 ${p.invite_code} 복사됨`);
              refresh();
            } catch (e: any) {
              toast.error(e.message);
            }
          }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> 초대 코드 생성
        </Button>
        <div className="flex gap-2 flex-1">
          <Input
            placeholder="친구의 초대 코드"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await acceptInvite(code);
                toast.success("페어 연결!");
                setCode("");
                refresh();
              } catch (e: any) {
                toast.error(e.message);
              }
            }}
          >
            수락
          </Button>
        </div>
      </div>
      {!pairs.length && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          아직 페어가 없어요. 초대 코드를 만들어 친구에게 공유하세요.
        </p>
      )}
      <div className="space-y-2">
        {pairs.map((p) => {
          const myId = profiles.get(p.a_user_id) ? p.a_user_id : p.b_user_id;
          const partnerId = p.a_user_id === myId ? p.b_user_id : p.a_user_id;
          const partner = partnerId ? profiles.get(partnerId) : null;
          return (
            <div
              key={p.id}
              className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-primary" />
                {p.status === "pending" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted-foreground">대기 중 · 코드</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(p.invite_code);
                        toast.success("복사됨");
                      }}
                      className="font-mono text-[13px] inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {p.invite_code}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                ) : partner ? (
                  <PersonaChip profile={partner} />
                ) : (
                  <span className="text-[12px] text-muted-foreground">파트너</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    p.status === "active" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {p.status}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await endPair(p.id);
                    refresh();
                  }}
                >
                  종료
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
