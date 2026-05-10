import { supabase } from "@/integrations/supabase/client";

export interface Expense {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  category: string;
  name: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export async function listExpensesByMonth(userId: string, monthKey: string): Promise<Expense[]> {
  // monthKey: YYYY-MM
  const start = `${monthKey}-01`;
  const [y, m] = monthKey.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lt("date", nextMonth)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function listExpensesByYear(userId: string, year: number): Promise<Expense[]> {
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", start)
    .lt("date", end)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function createExpense(input: {
  user_id: string;
  date: string;
  category: string;
  name: string;
  amount: number;
}): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return normalize(data);
}

export async function bulkCreateExpenses(rows: Array<{
  user_id: string;
  date: string;
  category: string;
  name: string;
  amount: number;
}>): Promise<number> {
  if (!rows.length) return 0;
  // chunk to keep request size sane
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const slice = rows.slice(i, i + 500);
    const { error } = await supabase.from("expenses").insert(slice);
    if (error) throw error;
    inserted += slice.length;
  }
  return inserted;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
}

function normalize(row: any): Expense {
  return {
    id: row.id,
    user_id: row.user_id,
    date: row.date,
    category: row.category,
    name: row.name,
    amount: Number(row.amount),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function notifyExpensesChanged() {
  window.dispatchEvent(new Event("expenses-updated"));
}
