import { supabase } from "@/integrations/supabase/client";
import { loadLog, saveLog, todayStr } from "./goals";

export interface RoutineTemplate {
  id: string;
  user_id: string;
  version: number;
  is_active: boolean;
  effective_from: string;
  created_at: string;
}

export interface RoutineTemplateItem {
  id: string;
  template_id: string;
  user_id: string;
  label: string;
  phase: number; // 1 | 2 | 3
  position: number;
  goal_id: string | null;
  action_id: string | null;
  created_at: string;
}

export interface RoutineLog {
  id: string;
  user_id: string;
  log_date: string;
  template_id: string;
  checked_item_ids: string[];
}

export const DEFAULT_SEED: Array<Pick<RoutineTemplateItem, "label" | "phase" | "position">> = [
  { label: "기상 & 운동",   phase: 1, position: 0 },
  { label: "찬물 샤워",      phase: 1, position: 1 },
  { label: "프로틴 & 영양제", phase: 1, position: 2 },
  { label: "독서 30분",      phase: 1, position: 3 },
  { label: "회사 업무",      phase: 2, position: 0 },
  { label: "헬스",           phase: 3, position: 0 },
  { label: "지출 기록",      phase: 3, position: 1 },
  { label: "하루 점검",      phase: 3, position: 2 },
];

export async function getActiveTemplate(userId: string): Promise<{
  template: RoutineTemplate;
  items: RoutineTemplateItem[];
}> {
  const { data: existing, error } = await supabase
    .from("routine_templates")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  let template = existing as RoutineTemplate | null;

  if (!template) {
    // Seed v1
    const { data: ins, error: e1 } = await supabase
      .from("routine_templates")
      .insert({ user_id: userId, version: 1, is_active: true })
      .select()
      .single();
    if (e1) throw e1;
    template = ins as RoutineTemplate;
    const seedRows = DEFAULT_SEED.map((s) => ({
      template_id: template!.id,
      user_id: userId,
      label: s.label,
      phase: s.phase,
      position: s.position,
    }));
    const { error: e2 } = await supabase.from("routine_template_items").insert(seedRows);
    if (e2) throw e2;
  }

  const { data: items, error: e3 } = await supabase
    .from("routine_template_items")
    .select("*")
    .eq("template_id", template.id)
    .order("phase", { ascending: true })
    .order("position", { ascending: true });
  if (e3) throw e3;

  return { template, items: (items ?? []) as RoutineTemplateItem[] };
}

export async function getLogForDate(userId: string, date: string): Promise<RoutineLog | null> {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", date)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...(data as any),
    checked_item_ids: (data as any).checked_item_ids ?? [],
  } as RoutineLog;
}

export async function upsertLogChecked(
  userId: string,
  date: string,
  templateId: string,
  checked: string[]
) {
  const { error } = await supabase
    .from("routine_logs")
    .upsert(
      {
        user_id: userId,
        log_date: date,
        template_id: templateId,
        checked_item_ids: checked,
      },
      { onConflict: "user_id,log_date" }
    );
  if (error) throw error;
}

export async function listLogs(userId: string, fromDate: string, toDate: string) {
  const { data, error } = await supabase
    .from("routine_logs")
    .select("log_date, checked_item_ids, template_id")
    .eq("user_id", userId)
    .gte("log_date", fromDate)
    .lte("log_date", toDate);
  if (error) throw error;
  return (data ?? []) as Array<Pick<RoutineLog, "log_date" | "checked_item_ids" | "template_id">>;
}

/**
 * Replace active template with a new version.
 * Items: array of { label, phase, position, goal_id?, action_id? }
 */
export async function publishNewVersion(
  userId: string,
  currentVersion: number,
  items: Array<{
    label: string;
    phase: number;
    position: number;
    goal_id?: string | null;
    action_id?: string | null;
  }>
) {
  // 1. Deactivate all existing active templates for the user
  const { error: e0 } = await supabase
    .from("routine_templates")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);
  if (e0) throw e0;

  // 2. Insert new template
  const { data: newTpl, error: e1 } = await supabase
    .from("routine_templates")
    .insert({
      user_id: userId,
      version: currentVersion + 1,
      is_active: true,
    })
    .select()
    .single();
  if (e1) throw e1;

  // 3. Insert items
  if (items.length) {
    const rows = items.map((it) => ({
      template_id: (newTpl as RoutineTemplate).id,
      user_id: userId,
      label: it.label,
      phase: it.phase,
      position: it.position,
      goal_id: it.goal_id ?? null,
      action_id: it.action_id ?? null,
    }));
    const { error: e2 } = await supabase.from("routine_template_items").insert(rows);
    if (e2) throw e2;
  }

  return newTpl as RoutineTemplate;
}

/**
 * Toggle a single routine item check for today, and if it's a vision-linked
 * item, also reflect into the goal_log via localStorage goals lib.
 */
export async function toggleRoutineItem(opts: {
  userId: string;
  templateId: string;
  item: RoutineTemplateItem;
  currentChecked: string[];
}): Promise<string[]> {
  const { userId, templateId, item, currentChecked } = opts;
  const date = todayStr();
  const isOn = currentChecked.includes(item.id);
  const next = isOn
    ? currentChecked.filter((id) => id !== item.id)
    : [...currentChecked, item.id];

  await upsertLogChecked(userId, date, templateId, next);

  // Sync to goal log when linked
  if (item.goal_id && item.action_id) {
    const log = loadLog(item.goal_id, date);
    const inLog = log.checkedActionIds.includes(item.action_id);
    let actionIds = log.checkedActionIds;
    if (isOn && inLog) {
      actionIds = actionIds.filter((id) => id !== item.action_id);
    } else if (!isOn && !inLog) {
      actionIds = [...actionIds, item.action_id];
    }
    saveLog({ ...log, checkedActionIds: actionIds });
  }

  window.dispatchEvent(new Event("routine-updated"));
  return next;
}

export function getDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
