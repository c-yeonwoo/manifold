import { supabase } from "@/integrations/supabase/client";
import type { Goal } from "./goals";

export interface PublicProfile {
  id: string;
  handle: string;
  nickname: string | null;
  avatar_url: string | null;
  persona_age_bucket: string | null;
  persona_role: string | null;
  persona_region: string | null;
  bio: string | null;
  is_public: boolean;
  share_life_vision: boolean;
  life_vision: string | null;
}

export interface SharedVision {
  id: string;
  user_id: string;
  goal_id: string;
  snapshot: {
    title: string;
    vision?: string;
    category: string;
    completed?: boolean;
    deadline?: string;
    actionsCount?: number;
  };
  shared_at: string;
}

export interface SharedFinanceSummary {
  id: string;
  user_id: string;
  year: number;
  month: number;
  totals: Record<string, number>;
  note: string;
  shared_at: string;
}

export const AGE_BUCKETS = ["10s", "20s", "30s", "40s", "50s+"] as const;

export async function getMyProfile() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", u.user.id)
    .maybeSingle();
  return data as PublicProfile | null;
}

export async function updateMyProfile(patch: Partial<PublicProfile>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { error } = await supabase.from("profiles").update(patch).eq("id", u.user.id);
  if (error) throw error;
}

export async function getProfileByHandle(handle: string) {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .eq("is_public", true)
    .maybeSingle();
  return data as PublicProfile | null;
}

// ----- Vision sharing -----
export function buildVisionSnapshot(goal: Goal) {
  return {
    title: goal.title,
    vision: goal.vision,
    category: goal.category,
    completed: !!goal.completedAt,
    deadline: goal.deadline,
    actionsCount: goal.actions.length,
  };
}

export async function shareVision(goal: Goal) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { error } = await supabase.from("shared_visions").upsert(
    {
      user_id: u.user.id,
      goal_id: goal.id,
      snapshot: buildVisionSnapshot(goal),
    },
    { onConflict: "user_id,goal_id" }
  );
  if (error) throw error;
}

export async function unshareVision(goalId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  await supabase
    .from("shared_visions")
    .delete()
    .eq("user_id", u.user.id)
    .eq("goal_id", goalId);
}

export async function isVisionShared(goalId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await supabase
    .from("shared_visions")
    .select("id")
    .eq("user_id", u.user.id)
    .eq("goal_id", goalId)
    .maybeSingle();
  return !!data;
}

export async function listMySharedVisions() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from("shared_visions")
    .select("*")
    .eq("user_id", u.user.id);
  return (data ?? []) as SharedVision[];
}

export async function listVisionsByUser(userId: string) {
  const { data } = await supabase
    .from("shared_visions")
    .select("*")
    .eq("user_id", userId)
    .order("shared_at", { ascending: false });
  return (data ?? []) as SharedVision[];
}

export async function feedVisions(limit = 30) {
  const { data } = await supabase
    .from("shared_visions")
    .select("*")
    .order("shared_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SharedVision[];
}

// ----- Finance sharing -----
export async function shareFinanceSummary(input: {
  year: number;
  month: number;
  totals: Record<string, number>;
  note?: string;
}) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { error } = await supabase.from("shared_finance_summaries").upsert(
    {
      user_id: u.user.id,
      year: input.year,
      month: input.month,
      totals: input.totals,
      note: input.note ?? "",
    },
    { onConflict: "user_id,year,month" }
  );
  if (error) throw error;
}

export async function feedFinance(limit = 30) {
  const { data } = await supabase
    .from("shared_finance_summaries")
    .select("*")
    .order("shared_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SharedFinanceSummary[];
}

// ----- Profiles batch -----
export async function getProfilesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, PublicProfile>();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("id", Array.from(new Set(ids)));
  const m = new Map<string, PublicProfile>();
  (data ?? []).forEach((p: any) => m.set(p.id, p));
  return m;
}

// ----- Cheers -----
export type CheerTarget = "vision" | "finance" | "streak";

export async function toggleCheer(targetType: CheerTarget, targetId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { data: existing } = await supabase
    .from("cheers")
    .select("id")
    .eq("user_id", u.user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  if (existing) {
    await supabase.from("cheers").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("cheers").insert({
    user_id: u.user.id,
    target_type: targetType,
    target_id: targetId,
  });
  return true;
}

export async function cheerCounts(targetType: CheerTarget, ids: string[]) {
  if (!ids.length) return new Map<string, number>();
  const { data } = await supabase
    .from("cheers")
    .select("target_id")
    .eq("target_type", targetType)
    .in("target_id", ids);
  const m = new Map<string, number>();
  (data ?? []).forEach((r: any) => m.set(r.target_id, (m.get(r.target_id) ?? 0) + 1));
  return m;
}

export async function myCheers(targetType: CheerTarget, ids: string[]) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user || !ids.length) return new Set<string>();
  const { data } = await supabase
    .from("cheers")
    .select("target_id")
    .eq("user_id", u.user.id)
    .eq("target_type", targetType)
    .in("target_id", ids);
  return new Set((data ?? []).map((r: any) => r.target_id));
}
