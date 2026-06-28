import { supabase } from "@/integrations/supabase/client";

export interface Affirmation {
  id: string;
  user_id: string;
  text: string;
  position: number;
  is_favorite: boolean;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export async function listAffirmations(): Promise<Affirmation[]> {
  const { data, error } = await supabase
    .from("affirmations")
    .select("*")
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Affirmation[];
}

export async function createAffirmation(
  userId: string,
  text: string,
  position: number,
  category: string | null = null
) {
  const { data, error } = await supabase
    .from("affirmations")
    .insert({ user_id: userId, text, position, category })
    .select()
    .single();
  if (error) throw error;
  return data as Affirmation;
}

export async function updateAffirmation(
  id: string,
  patch: Partial<Pick<Affirmation, "text" | "is_favorite" | "category" | "position">>
) {
  const { error } = await supabase.from("affirmations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteAffirmation(id: string) {
  const { error } = await supabase.from("affirmations").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderAffirmations(ordered: { id: string; position: number }[]) {
  // batch update sequentially (small N)
  await Promise.all(
    ordered.map((o) =>
      supabase.from("affirmations").update({ position: o.position }).eq("id", o.id)
    )
  );
}

export const SEED_EXAMPLES = [
  "나는 매일 한 단계씩 성장한다.",
  "불편함과 고통은 성장통일 뿐이다.",
  "말보다 행동으로 보여준다.",
  "오늘 하루도 감사하다.",
  "“오늘의 나는 어제의 내가 만든다.”",
  "“하루를 잘 살면 행복한 잠을 자고, 일생을 잘 살면 행복한 죽음을 맞는다.” — 다빈치",
];
