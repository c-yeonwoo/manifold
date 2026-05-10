import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  nickname: string | null;
  avatar_url: string | null;
}

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  if (!user) return null;
  const name = profile?.nickname ?? user.email?.split("@")[0] ?? "Me";
  const initial = name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary transition-colors">
        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[12px] font-medium overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <span className="text-[12px] text-foreground hidden sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <div className="text-[12px] text-foreground">{name}</div>
          <div className="text-[10px] text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/profile">
            <UserIcon className="w-3.5 h-3.5 mr-2" />
            프로필 설정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="w-3.5 h-3.5 mr-2" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
