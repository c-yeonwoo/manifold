import { loadJSON, saveJSON } from "./store";
import { supabase } from "@/integrations/supabase/client";

export interface ActionItem {
  id: string;
  label: string;
}

// =====================================================================
// manifold — graph-native life model.
//
// Replaces the fixed wheel-of-life tree with a layered flywheel:
//   BASE  (루틴·건강·마인드셋)  →  CORE  (커리어 ↔ 자동화)  →  OUTPUT (자산·사업·관계)
// Edges carry direction and meaning, so feedback loops are first-class.
//
// Public surface stays synchronous (in-memory cache) like goals.ts, with
// writes mirrored to Supabase asynchronously and a localStorage fallback
// for guests. Mutations emit a `manifold-updated` window event.
// =====================================================================

export type Layer = "base" | "core" | "output";
export type NodeStatus = "active" | "queued" | "done" | "archived";
export type EdgeType = "feeds" | "reinforces" | "gates" | "feedbacks";
export type FlowKind = "energy" | "cash" | "time" | "social" | "skill" | "focus";

// Only a handful of nodes run at full intensity at once; the rest queue.
export const ACTIVE_LIMIT = 3;

// Layers split by ROLE in the system, not by kind of activity:
//   BASE  = 유지   — 안 하면 깎이는 상태를 유지한다 (maintain)
//   CORE  = 축적   — 할수록 복리로 쌓이는 역량 (accumulate / compound)
//   OUTPUT= 산출   — 쌓은 걸 밖으로 내보내 자산화한다 (publish)
// This paradigm is universal; the actual nodes per person live in the seed.
export const LAYERS: { key: Layer; label: string; role: string; hue: number; blurb: string }[] = [
  { key: "base",   label: "BASE",   role: "유지", hue: 142, blurb: "안 하면 깎이는 상태를 유지 — 에너지·집중·일관성을 공급" },
  { key: "core",   label: "CORE",   role: "축적", hue: 38,  blurb: "할수록 복리로 쌓이는 역량 — '끊기지 않음'이 변수(streak)" },
  { key: "output", label: "OUTPUT", role: "산출", hue: 210, blurb: "쌓은 걸 밖으로 내보내 자산화 — 다시 BASE·CORE로 환류" },
];

export const getLayer = (key: string) => LAYERS.find((l) => l.key === key);

export const EDGE_META: Record<EdgeType, { label: string; dashed: boolean }> = {
  feeds:      { label: "공급",   dashed: false },
  reinforces: { label: "상호강화", dashed: false },
  gates:      { label: "선행",   dashed: false },
  feedbacks:  { label: "피드백", dashed: true },
};

// Timeline buckets for the horizon field (26Y2H → 28Y2H + ambient/undecided).
export const HORIZONS = ["now", "26H2", "27H1", "27H2", "28H1", "28H2", "TBD"] as const;
export type Horizon = (typeof HORIZONS)[number];

// Suggested node kinds (free text in the DB; these drive the picker).
export const NODE_KINDS = [
  "mindset",
  "routine",
  "exercise",
  "automation",
  "language",
  "music",
  "career",
  "venture",
  "asset",
  "brand",
  "relationship",
  "goal",
] as const;

export const FLOW_KINDS: FlowKind[] = ["energy", "cash", "time", "social", "skill", "focus"];

export interface ManifoldNode {
  id: string;
  layer: Layer;
  kind: string;
  title: string;
  description: string;
  status: NodeStatus;
  priority: number;
  x?: number;
  y?: number;
  horizon?: string;
  targetDate?: string;
  category?: string;
  vision: string;
  imageUrl?: string;
  actions: ActionItem[];
  meta: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface ManifoldEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
  flow?: FlowKind;
  label: string;
}

export interface NodeLog {
  nodeId: string;
  date: string;
  checkedActionIds: string[];
  note: string;
}

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ---- row <-> model mapping --------------------------------------------------

const dbRowToNode = (r: any): ManifoldNode => ({
  id: r.id,
  layer: r.layer as Layer,
  kind: r.kind ?? "goal",
  title: r.title,
  description: r.description ?? "",
  status: (r.status as NodeStatus) ?? "queued",
  priority: r.priority ?? 0,
  x: r.x ?? undefined,
  y: r.y ?? undefined,
  horizon: r.horizon ?? undefined,
  targetDate: r.target_date ?? undefined,
  category: r.category ?? undefined,
  vision: r.vision ?? "",
  imageUrl: r.image_url ?? undefined,
  actions: Array.isArray(r.actions) ? (r.actions as ActionItem[]) : [],
  meta: r.meta && typeof r.meta === "object" ? r.meta : {},
  createdAt: r.created_at,
  completedAt: r.completed_at ?? undefined,
});

const nodeToDbRow = (n: ManifoldNode, userId: string) => ({
  id: n.id,
  user_id: userId,
  layer: n.layer,
  kind: n.kind,
  title: n.title,
  description: n.description ?? "",
  status: n.status,
  priority: n.priority ?? 0,
  x: n.x ?? null,
  y: n.y ?? null,
  horizon: n.horizon ?? null,
  target_date: n.targetDate ?? null,
  category: n.category ?? null,
  vision: n.vision ?? "",
  image_url: n.imageUrl ?? null,
  actions: (n.actions ?? []) as any,
  meta: (n.meta ?? {}) as any,
  completed_at: n.completedAt ?? null,
});

const dbRowToEdge = (r: any): ManifoldEdge => ({
  id: r.id,
  sourceId: r.source_id,
  targetId: r.target_id,
  type: (r.type as EdgeType) ?? "feeds",
  flow: (r.flow as FlowKind) ?? undefined,
  label: r.label ?? "",
});

const edgeToDbRow = (e: ManifoldEdge, userId: string) => ({
  id: e.id,
  user_id: userId,
  source_id: e.sourceId,
  target_id: e.targetId,
  type: e.type,
  flow: e.flow ?? null,
  label: e.label ?? "",
});

// supabase client is typed against generated types that don't yet know about
// these tables; cast through `any` (same approach the rest of the app uses).
const db = supabase as any;

// ---- in-memory cache --------------------------------------------------------

let CURRENT_USER_ID: string | null = null;
let NODES_CACHE: ManifoldNode[] = [];
let EDGES_CACHE: ManifoldEdge[] = [];
let LOGS_CACHE: Map<string, NodeLog> = new Map(); // key = `${nodeId}__${date}`
let HYDRATED = false;

const emit = () => window.dispatchEvent(new Event("manifold-updated"));
const logCacheKey = (nodeId: string, date: string) => `${nodeId}__${date}`;

const dbRowToLog = (r: any): NodeLog => ({
  nodeId: r.node_id,
  date: r.log_date,
  checkedActionIds: Array.isArray(r.checked_action_ids) ? r.checked_action_ids : [],
  note: r.note ?? "",
});

// ---- guest (localStorage) fallback -----------------------------------------

const guestNodesKey = () => `manifold_nodes__guest`;
const guestEdgesKey = () => `manifold_edges__guest`;
const guestLogKey = (nodeId: string, date: string) => `manifold_log__guest__${nodeId}__${date}`;

function loadGuest() {
  NODES_CACHE = loadJSON<ManifoldNode[]>(guestNodesKey(), []);
  EDGES_CACHE = loadJSON<ManifoldEdge[]>(guestEdgesKey(), []);
  LOGS_CACHE = new Map();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("manifold_log__guest__")) {
      try {
        const log = JSON.parse(localStorage.getItem(k)!) as NodeLog;
        LOGS_CACHE.set(logCacheKey(log.nodeId, log.date), log);
      } catch {}
    }
  }
  HYDRATED = true;
}

function persistGuest() {
  saveJSON(guestNodesKey(), NODES_CACHE);
  saveJSON(guestEdgesKey(), EDGES_CACHE);
}

async function hydrateFromSupabase(userId: string) {
  HYDRATED = false;
  NODES_CACHE = [];
  EDGES_CACHE = [];
  LOGS_CACHE = new Map();

  const [{ data: nodes }, { data: edges }, { data: logs }] = await Promise.all([
    db.from("manifold_nodes").select("*").eq("user_id", userId),
    db.from("manifold_edges").select("*").eq("user_id", userId),
    db.from("manifold_node_logs").select("*").eq("user_id", userId),
  ]);

  NODES_CACHE = (nodes ?? []).map(dbRowToNode);
  EDGES_CACHE = (edges ?? []).map(dbRowToEdge);
  for (const r of logs ?? []) {
    const log = dbRowToLog(r);
    LOGS_CACHE.set(logCacheKey(log.nodeId, log.date), log);
  }
  HYDRATED = true;
  emit();
}

export function setManifoldUserScope(userId: string | null) {
  if (CURRENT_USER_ID === userId && HYDRATED) return;
  CURRENT_USER_ID = userId;
  if (!userId) {
    loadGuest();
    emit();
    return;
  }
  hydrateFromSupabase(userId).catch((e) => {
    console.error("[manifold] hydrate failed", e);
    HYDRATED = true;
    emit();
  });
}

export const isManifoldHydrated = () => HYDRATED;

// ---- node reads -------------------------------------------------------------

export function loadNodes(): ManifoldNode[] {
  return NODES_CACHE;
}
export function loadEdges(): ManifoldEdge[] {
  return EDGES_CACHE;
}
export function getNode(id: string): ManifoldNode | undefined {
  return NODES_CACHE.find((n) => n.id === id);
}
export function nodesByLayer(layer: Layer): ManifoldNode[] {
  return NODES_CACHE.filter((n) => n.layer === layer && n.status !== "archived");
}
export function activeNodes(): ManifoldNode[] {
  return NODES_CACHE.filter((n) => n.status === "active");
}
export function queuedNodes(): ManifoldNode[] {
  return NODES_CACHE.filter((n) => n.status === "queued");
}
export function edgesFrom(nodeId: string): ManifoldEdge[] {
  return EDGES_CACHE.filter((e) => e.sourceId === nodeId);
}
export function edgesTo(nodeId: string): ManifoldEdge[] {
  return EDGES_CACHE.filter((e) => e.targetId === nodeId);
}

// ---- contention (WIP) -------------------------------------------------------

/** True when another node can be promoted to `active` without exceeding the cap. */
export function canActivate(): boolean {
  return activeNodes().length < ACTIVE_LIMIT;
}

/**
 * Unmet `gates` predecessors of a node — edges of type `gates` whose source is
 * not yet `done`. A node with unmet gates should not be started.
 */
export function unmetGates(nodeId: string): ManifoldNode[] {
  return edgesTo(nodeId)
    .filter((e) => e.type === "gates")
    .map((e) => getNode(e.sourceId))
    .filter((n): n is ManifoldNode => !!n && n.status !== "done");
}

// ---- node writes ------------------------------------------------------------

export function upsertNode(node: ManifoldNode) {
  const idx = NODES_CACHE.findIndex((n) => n.id === node.id);
  if (idx >= 0) NODES_CACHE[idx] = node;
  else NODES_CACHE.push(node);
  emit();

  if (CURRENT_USER_ID) {
    db.from("manifold_nodes")
      .upsert(nodeToDbRow(node, CURRENT_USER_ID))
      .then(({ error }: any) => error && console.error("[manifold] node upsert failed", error));
  } else {
    persistGuest();
  }
}

export function setNodeStatus(id: string, status: NodeStatus) {
  const n = getNode(id);
  if (!n) return;
  n.status = status;
  n.completedAt = status === "done" ? new Date().toISOString() : undefined;
  upsertNode(n);
}

export function deleteNode(id: string) {
  NODES_CACHE = NODES_CACHE.filter((n) => n.id !== id);
  EDGES_CACHE = EDGES_CACHE.filter((e) => e.sourceId !== id && e.targetId !== id);
  for (const k of Array.from(LOGS_CACHE.keys())) {
    if (k.startsWith(`${id}__`)) LOGS_CACHE.delete(k);
  }
  emit();

  if (CURRENT_USER_ID) {
    db.from("manifold_nodes").delete().eq("id", id).then(({ error }: any) => {
      if (error) console.error("[manifold] node delete failed", error);
    });
    // edges cascade via FK, but drop locally already done above
  } else {
    persistGuest();
  }
}

// ---- edge writes ------------------------------------------------------------

export function upsertEdge(edge: ManifoldEdge) {
  const idx = EDGES_CACHE.findIndex((e) => e.id === edge.id);
  if (idx >= 0) EDGES_CACHE[idx] = edge;
  else EDGES_CACHE.push(edge);
  emit();

  if (CURRENT_USER_ID) {
    db.from("manifold_edges")
      .upsert(edgeToDbRow(edge, CURRENT_USER_ID))
      .then(({ error }: any) => error && console.error("[manifold] edge upsert failed", error));
  } else {
    persistGuest();
  }
}

export function deleteEdge(id: string) {
  EDGES_CACHE = EDGES_CACHE.filter((e) => e.id !== id);
  emit();

  if (CURRENT_USER_ID) {
    db.from("manifold_edges").delete().eq("id", id).then(({ error }: any) => {
      if (error) console.error("[manifold] edge delete failed", error);
    });
  } else {
    persistGuest();
  }
}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

// ---- daily node logs (execution layer) -------------------------------------

export function loadNodeLog(nodeId: string, date: string): NodeLog {
  return (
    LOGS_CACHE.get(logCacheKey(nodeId, date)) ?? { nodeId, date, checkedActionIds: [], note: "" }
  );
}

export function saveNodeLog(log: NodeLog) {
  LOGS_CACHE.set(logCacheKey(log.nodeId, log.date), log);
  emit();

  if (CURRENT_USER_ID) {
    db.from("manifold_node_logs")
      .upsert(
        {
          user_id: CURRENT_USER_ID,
          node_id: log.nodeId,
          log_date: log.date,
          checked_action_ids: log.checkedActionIds as any,
          note: log.note,
        },
        { onConflict: "node_id,log_date" }
      )
      .then(({ error }: any) => error && console.error("[manifold] node_log upsert failed", error));
  } else {
    saveJSON(guestLogKey(log.nodeId, log.date), log);
  }
}

/** Toggle one action's checked state for a node on a date; persists the log. */
export function toggleNodeAction(nodeId: string, actionId: string, date = todayStr()) {
  const log = loadNodeLog(nodeId, date);
  const on = log.checkedActionIds.includes(actionId);
  const checkedActionIds = on
    ? log.checkedActionIds.filter((id) => id !== actionId)
    : [...log.checkedActionIds, actionId];
  saveNodeLog({ ...log, checkedActionIds });
}

export function todayNodeProgress(node: ManifoldNode): { done: number; total: number } {
  const log = loadNodeLog(node.id, todayStr());
  const total = node.actions.length;
  const valid = new Set(node.actions.map((a) => a.id));
  const done = log.checkedActionIds.filter((id) => valid.has(id)).length;
  return { done, total };
}

export function listNodeLogs(nodeId: string): NodeLog[] {
  const out: NodeLog[] = [];
  for (const [k, v] of LOGS_CACHE) if (k.startsWith(`${nodeId}__`)) out.push(v);
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
