import { supabase } from "@/integrations/supabase/client";

export interface Challenge {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  days: number;
  starts_at: string;
  ends_at: string | null;
  is_public: boolean;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  current_streak: number;
}

export async function listChallenges() {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Challenge[];
}

export async function createChallenge(input: { title: string; description?: string; days: number }) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const ends = new Date();
  ends.setDate(ends.getDate() + input.days);
  const { data, error } = await supabase
    .from("challenges")
    .insert({
      owner_id: u.user.id,
      title: input.title,
      description: input.description ?? "",
      days: input.days,
      starts_at: new Date().toISOString().slice(0, 10),
      ends_at: ends.toISOString().slice(0, 10),
      is_public: true,
    })
    .select()
    .single();
  if (error) throw error;
  // auto-join owner
  await joinChallenge(data.id);
  return data as Challenge;
}

export async function joinChallenge(challengeId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  const { error } = await supabase
    .from("challenge_participants")
    .insert({ challenge_id: challengeId, user_id: u.user.id })
    .select()
    .maybeSingle();
  if (error && !String(error.message).includes("duplicate")) throw error;
}

export async function leaveChallenge(challengeId: string) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("not signed in");
  await supabase
    .from("challenge_participants")
    .delete()
    .eq("challenge_id", challengeId)
    .eq("user_id", u.user.id);
}

export async function listParticipants(challengeId: string) {
  const { data } = await supabase
    .from("challenge_participants")
    .select("*")
    .eq("challenge_id", challengeId);
  return (data ?? []) as ChallengeParticipant[];
}

export async function myJoinedIds(): Promise<Set<string>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return new Set();
  const { data } = await supabase
    .from("challenge_participants")
    .select("challenge_id")
    .eq("user_id", u.user.id);
  return new Set((data ?? []).map((r: any) => r.challenge_id));
}
