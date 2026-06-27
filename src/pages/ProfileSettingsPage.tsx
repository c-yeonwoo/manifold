import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setNickname(data?.nickname ?? "");
        setAvatarUrl(data?.avatar_url ?? "");
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nickname: nickname.trim() || null, avatar_url: avatarUrl.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message ?? "저장 실패");
    else toast.success("저장됐어요");
  };

  return (
    <div className="max-w-xl animate-fade-up">
      <Link to="/" className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3 h-3" /> 홈
      </Link>
      <h1 className="text-2xl font-medium mb-6">프로필 설정</h1>

      <div className="space-y-5">
        <Row label="닉네임">
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="표시 이름" />
        </Row>
        <Row label="아바타 URL" desc="이미지 주소 (선택).">
          <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </Row>
        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving}>{saving ? "저장 중…" : "저장"}</Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
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
