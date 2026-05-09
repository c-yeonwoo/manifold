import { supabase } from "@/integrations/supabase/client";

export async function myStreak(): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return 0;
  const { data, error } = await supabase.rpc("compute_streak", { _user_id: u.user.id });
  if (error) return 0;
  return (data as number) ?? 0;
}

export async function streakOf(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("compute_streak", { _user_id: userId });
  if (error) return 0;
  return (data as number) ?? 0;
}
