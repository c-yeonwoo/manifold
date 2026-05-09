import { useEffect, useState } from "react";
import {
  getMyProfile,
  updateMyProfile,
  AGE_BUCKETS,
  type PublicProfile,
} from "@/lib/community";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ProfileSettingsPage() {
  const [p, setP] = useState<PublicProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile().then(setP);
  }, []);

  if (!p) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  const update = (patch: Partial<PublicProfile>) => setP({ ...p, ...patch });

  const save = async () => {
    setSaving(true);
    try {
      await updateMyProfile({
        handle: p.handle,
        persona_age_bucket: p.persona_age_bucket,
        persona_role: p.persona_role,
        persona_region: p.persona_region,
        bio: p.bio,
        is_public: p.is_public,
        share_life_vision: p.share_life_vision,
        life_vision: p.life_vision,
      });
      toast.success("저장됐어요");
    } catch (e: any) {
      toast.error(e.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl animate-fade-up">
      <Link to="/community" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> 커뮤니티
      </Link>
      <h1 className="text-2xl font-medium mb-1">공개 프로필</h1>
      <p className="text-[13px] text-muted-foreground mb-6">
        익명 핸들과 페르소나로 다른 사용자에게 표시돼요. 끄면 모든 공유가 숨겨져요.
      </p>

      <div className="space-y-5">
        <Row label="공개" desc="끄면 내 비전/지출 카드도 피드에서 보이지 않아요.">
          <Switch checked={p.is_public} onCheckedChange={(v) => update({ is_public: v })} />
        </Row>

        <Row label="핸들" desc="다른 사용자에게 표시되는 ID (@u_xxxxxx).">
          <Input
            value={p.handle ?? ""}
            onChange={(e) => update({ handle: e.target.value.replace(/\s/g, "") })}
            className="font-mono"
          />
        </Row>

        <Row label="나이대">
          <div className="flex flex-wrap gap-1.5">
            {AGE_BUCKETS.map((b) => (
              <button
                key={b}
                onClick={() => update({ persona_age_bucket: p.persona_age_bucket === b ? null : b })}
                className={`px-2.5 py-1 rounded-md text-[12px] ${
                  p.persona_age_bucket === b
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </Row>

        <Row label="직업">
          <Input
            value={p.persona_role ?? ""}
            onChange={(e) => update({ persona_role: e.target.value })}
            placeholder="개발자, 디자이너, 학생…"
          />
        </Row>

        <Row label="지역">
          <Input
            value={p.persona_region ?? ""}
            onChange={(e) => update({ persona_region: e.target.value })}
            placeholder="서울, 부산…"
          />
        </Row>

        <Row label="소개">
          <Textarea
            value={p.bio ?? ""}
            onChange={(e) => update({ bio: e.target.value })}
            rows={3}
            placeholder="한 줄 소개"
          />
        </Row>

        <Row
          label="Life Vision 공개"
          desc="공개 프로필 상단에 한 줄 비전을 보여줄지."
        >
          <Switch
            checked={p.share_life_vision}
            onCheckedChange={(v) => update({ share_life_vision: v })}
          />
        </Row>

        {p.share_life_vision && (
          <Row label="Life Vision">
            <Input
              value={p.life_vision ?? ""}
              onChange={(e) => update({ life_vision: e.target.value })}
              placeholder="원하는 건 무엇이든 이뤄진다"
            />
          </Row>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-border pb-4">
      <div className="flex-1">
        <div className="text-[13px] font-medium">{label}</div>
        {desc && <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>}
      </div>
      <div className="w-64 shrink-0">{children}</div>
    </div>
  );
}
