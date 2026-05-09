import { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { enableGuest } from "@/lib/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav(from, { replace: true });
  }, [user, nav, from]);

  if (loading) return null;
  if (user) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { nickname: nickname || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("가입 완료! 메일함에서 인증 메일을 확인해주세요.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("환영합니다");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "오류가 발생했어요";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google 로그인 실패");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    nav(from, { replace: true });
  };

  const browseAsGuest = () => {
    enableGuest();
    toast.success("둘러보기 모드로 입장했어요");
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium tracking-tight text-primary font-mono">IAM</h1>
          <p className="text-[12px] text-muted-foreground mt-2 tracking-[0.3em] uppercase">
            I am becoming
          </p>
          <p className="text-[13px] text-foreground/80 mt-4">원하는 건 무엇이든 이뤄진다</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">닉네임</label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="당신의 이름" />
            </div>
          )}
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">이메일</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">비밀번호</label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {mode === "signup" ? "가입하기" : "로그인"}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button variant="secondary" onClick={google} disabled={busy} className="w-full">
          Google로 계속하기
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="text-[12px] text-muted-foreground hover:text-foreground mt-6 w-full text-center"
        >
          {mode === "signin" ? "계정이 없으신가요? 가입하기" : "이미 계정이 있나요? 로그인"}
        </button>
      </div>
    </div>
  );
}
