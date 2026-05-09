import { supabase } from "@/integrations/supabase/client";

export interface Pair {
  id: string;
  a_user_id: string;
  b_user_id: string | null;
  invite_code: string;
  status: "pending" | "active" | "ended";
  created_at: string;
}

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function myPairs(): Promise<Pair[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("pairs")
    .select("*")
    .or(`a_user_id.eq.${u.user.id},b_user_id.eq.${u.user.id}`)
    .order("created_at", { ascending: false });
  return (data ?? []) as Pair[];
}

export async function createInvite(): Promise<Pair> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { data, error } = await supabase
    .from("pairs")
    .insert({
      a_user_id: u.user.id,
      invite_code: genCode(),
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data as Pair;
}

export async function acceptInvite(code: string): Promise<Pair> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { data: existing } = await supabase
    .from("pairs")
    .select("*")
    .eq("invite_code", code.trim().toUpperCase())
    .eq("status", "pending")
    .maybeSingle();
  if (!existing) throw new Error("초대 코드를 찾을 수 없어요");
  if ((existing as any).a_user_id === u.user.id) throw new Error("본인의 초대 코드는 사용할 수 없어요");
  const { data, error } = await supabase
    .from("pairs")
    .update({ b_user_id: u.user.id, status: "active" })
    .eq("id", (existing as any).id)
    .select()
    .single();
  if (error) throw error;
  return data as Pair;
}

export async function endPair(id: string) {
  await supabase.from("pairs").update({ status: "ended" }).eq("id", id);
}
