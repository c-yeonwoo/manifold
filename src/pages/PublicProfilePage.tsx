import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getProfileByHandle,
  listVisionsByUser,
  cheerCounts,
  myCheers,
  type PublicProfile,
  type SharedVision,
} from "@/lib/community";
import { streakOf } from "@/lib/streak";
import VisionShareCard from "@/components/community/VisionShareCard";
import PersonaChip from "@/components/community/PersonaChip";
import { ArrowLeft, Flame } from "lucide-react";

export default function PublicProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [visions, setVisions] = useState<SharedVision[]>([]);
  const [streak, setStreak] = useState(0);
  const [cheers, setCheers] = useState<Map<string, number>>(new Map());
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!handle) return;
    (async () => {
      const p = await getProfileByHandle(handle);
      setProfile(p);
      if (p) {
        const [v, s] = await Promise.all([listVisionsByUser(p.id), streakOf(p.id)]);
        setVisions(v);
        setStreak(s);
        const ids = v.map((x) => x.id);
        setCheers(await cheerCounts("vision", ids));
        setMine(await myCheers("vision", ids));
      }
      setLoading(false);
    })();
  }, [handle]);

  if (loading) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
  if (!profile)
    return (
      <div className="max-w-xl">
        <Link to="/community" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" /> 커뮤니티
        </Link>
        <p className="text-sm text-muted-foreground">존재하지 않거나 비공개 프로필이에요.</p>
      </div>
    );

  return (
    <div className="max-w-3xl animate-fade-up">
      <Link to="/community" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> 커뮤니티
      </Link>
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <PersonaChip profile={profile} />
        {profile.share_life_vision && profile.life_vision && (
          <h1 className="text-xl font-medium italic mt-3">"{profile.life_vision}"</h1>
        )}
        {profile.bio && (
          <p className="text-[13px] text-muted-foreground mt-2">{profile.bio}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Streak{" "}
            <span className="font-mono">{streak}일</span>
          </span>
          <span className="text-muted-foreground">
            공개 비전 <span className="font-mono">{visions.length}</span>
          </span>
        </div>
      </div>

      <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
        공개 비전
      </h2>
      {!visions.length && (
        <p className="text-sm text-muted-foreground py-8 text-center">
          아직 공개된 비전이 없어요.
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {visions.map((v) => (
          <VisionShareCard
            key={v.id}
            item={v}
            profile={profile}
            cheers={cheers.get(v.id) ?? 0}
            cheered={mine.has(v.id)}
          />
        ))}
      </div>
    </div>
  );
}
