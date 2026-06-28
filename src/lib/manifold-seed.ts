import {
  loadNodes,
  upsertNode,
  upsertEdge,
  uid,
  type Layer,
  type ManifoldNode,
  type ManifoldEdge,
  type NodeStatus,
  type EdgeType,
  type FlowKind,
} from "./manifold";

// =====================================================================
// EXAMPLE / PERSONAL seed — one concrete instance of the system.
//
// The *system* (layers as roles 유지/축적/산출, edge types, the 3-active
// contention rule, the flywheel) lives in manifold.ts and is universal.
// The *plan below* — these specific nodes, schedules, horizons — is one
// person's content and is meant to be swapped out per user (or replaced
// by importing their own report). Nothing here is load-bearing for the
// engine; treat it as a starter template.
//
// Derived from "Life OS — 선순환 시스템 (26Y2H → 28Y2H)".
// =====================================================================

export const SEED_TITLE = "Life OS — 선순환 시스템";

interface SeedNode {
  key: string; // temp key, resolved to a real id at insert time
  layer: Layer;
  kind: string;
  title: string;
  description: string;
  status: NodeStatus;
  horizon?: string;
  actions?: string[];
}

interface SeedEdge {
  from: string;
  to: string;
  type: EdgeType;
  flow?: FlowKind;
  label: string;
}

// Active threads are capped at 3 (ACTIVE_LIMIT): 루틴 · 커리어 · 부동산.
const SEED_NODES: SeedNode[] = [
  // 🟢 BASE · 유지 — 안 하면 깎이는 상태
  { key: "mindset",  layer: "base", kind: "mindset",  title: "마인드셋 (끌어당김)",      description: "믿음→일관성→결과. 통제 대신 활동량으로 기댓값을 올린다.",                status: "queued", horizon: "now" },
  { key: "routine",  layer: "base", kind: "routine",  title: "데일리 루틴 · 미라클모닝",  description: "수면·기상·아침 블록. 모든 루프를 돌리는 substrate. 22:30 취침으로 아침 사수.", status: "active", horizon: "now", actions: ["기상·명상", "공복 유산소", "07시 딥워크", "23시 취침"] },
  { key: "exercise", layer: "base", kind: "exercise", title: "운동 (헬스·러닝·테니스)",  description: "안 하면 깎이는 컨디션. 주 4회 고정. 강도보다 유지가 목표.",               status: "queued", horizon: "now" },

  // 🟡 CORE · 축적 — 복리로 쌓이는 역량 (지표 = streak)
  { key: "ai",    layer: "core", kind: "automation", title: "AI · 자동화 역량",        description: "에이전트 인프라·n8n·MCP. 별도 시간 없이 회사 업무(Lore)에 병행해 축적.", status: "queued", horizon: "now" },
  { key: "lang",  layer: "core", kind: "language",   title: "언어 (영어·일본어)",      description: "영어=글로벌 게이트(LST+이동 중 듣기), 일본어=Langdy 화상 반복예약 고정.", status: "queued", horizon: "now", actions: ["일본어 화상(Langdy)", "영어 듣기/복습"] },
  { key: "music", layer: "core", kind: "music",      title: "음악 · 보컬 (Pop·J-pop)", description: "보컬·홈레코딩 스킬 축적. 언어와 시너지(Jpop→일본어, Pop→영어).",         status: "queued", horizon: "now", actions: ["커버 연습"] },

  // 🔵 OUTPUT · 산출(Publish) — 쌓은 걸 밖으로 내보내 자산화
  { key: "career",  layer: "output", kind: "career",       title: "커리어 · 이직",          description: "CORE 전문성을 성과·이직으로 publish. 오늘의집 성과 → 네카라쿠배/글로벌.", status: "active", horizon: "28H1", actions: ["아침 영어 듣기", "Lore 고도화"] },
  { key: "online",  layer: "output", kind: "venture",      title: "온라인 사업 (팔레트·샐비지)", description: "자동화로 무인 운영하는 부수입원. 한계비용 0.",                       status: "queued", horizon: "26H2" },
  { key: "offline", layer: "output", kind: "venture",      title: "오프라인 벤처 (카페·혼술바)", description: "고변동 노드. 착수 전 실사 체크리스트 통과가 게이트.",                 status: "queued", horizon: "TBD" },
  { key: "asset",   layer: "output", kind: "asset",        title: "부동산 · 자산",          description: "사이클 분석→경매→내집마련. 생애최초 7억, DSR 40% 제약.",               status: "active", horizon: "26H2", actions: ["임장/경매 분석 30분", "DSR·한도 점검"] },
  { key: "content", layer: "output", kind: "brand",        title: "콘텐츠 publish (유튜브)", description: "CORE의 음악·언어를 내보내는 산출물. 월 1개 커버 cadence. 수입 아님.",   status: "queued", horizon: "26H2" },
  { key: "relation",layer: "output", kind: "relationship", title: "관계 → 결혼",            description: "활동 노드의 부산물로 재배선. 소셜 표면적 확대로 만남 기댓값↑.",          status: "queued", horizon: "27H2" },
];

const SEED_EDGES: SeedEdge[] = [
  // BASE → CORE : 에너지·집중·일관성
  { from: "routine",  to: "ai",       type: "feeds",      flow: "energy", label: "에너지·집중" },
  { from: "mindset",  to: "routine",  type: "reinforces", flow: "focus",  label: "일관성" },

  // CORE 내부 : 언어 ↔ 음악 상호 인풋
  { from: "lang",     to: "music",    type: "reinforces", flow: "skill",  label: "Jpop=일본어 / Pop=영어" },

  // CORE → OUTPUT : 쌓은 역량을 publish
  { from: "ai",       to: "career",   type: "feeds",      flow: "skill",  label: "성과·무인운영" },
  { from: "ai",       to: "online",   type: "feeds",      flow: "skill",  label: "무인운영" },
  { from: "lang",     to: "career",   type: "feeds",      flow: "skill",  label: "글로벌 기회" },
  { from: "music",    to: "content",  type: "feeds",      flow: "skill",  label: "커버 영상" },

  // OUTPUT 내부 : 현금흐름 → 자산
  { from: "career",   to: "asset",    type: "feeds",      flow: "cash",   label: "현금흐름·시간" },
  { from: "online",   to: "asset",    type: "feeds",      flow: "cash",   label: "부수입" },

  // OUTPUT → 관계 (소셜 표면적)
  { from: "offline",  to: "relation", type: "feeds",      flow: "social", label: "공간·인연" },
  { from: "content",  to: "relation", type: "feeds",      flow: "social", label: "노출" },
  { from: "exercise", to: "relation", type: "feeds",      flow: "social", label: "테니스·커뮤니티" },

  // OUTPUT → BASE/CORE 피드백 루프
  { from: "asset",    to: "ai",       type: "feedbacks",  flow: "time",   label: "재투자·시간자유" },
  { from: "relation", to: "mindset",  type: "feedbacks",  flow: "energy", label: "안정·동기" },
  { from: "content",  to: "mindset",  type: "feedbacks",  flow: "energy", label: "자신감" },

  // 타임라인 게이팅: 주담대(자산)가 이직(커리어)보다 앞서야 한도가 안 막힌다
  { from: "asset",    to: "career",   type: "gates",      flow: "cash",   label: "주담대 실행 후 이직" },
];

export interface LifeOSSeed {
  nodes: ManifoldNode[];
  edges: ManifoldEdge[];
}

/** Build the seed graph with fresh ids (does not persist). */
export function buildLifeOSSeed(): LifeOSSeed {
  const idByKey = new Map<string, string>();
  const now = new Date().toISOString();

  const nodes: ManifoldNode[] = SEED_NODES.map((s, i) => {
    const id = uid();
    idByKey.set(s.key, id);
    return {
      id,
      layer: s.layer,
      kind: s.kind,
      title: s.title,
      description: s.description,
      status: s.status,
      priority: SEED_NODES.length - i,
      horizon: s.horizon,
      vision: "",
      actions: (s.actions ?? []).map((label) => ({ id: uid(), label })),
      meta: { seeded: "life-os" },
      createdAt: now,
    };
  });

  const edges: ManifoldEdge[] = SEED_EDGES.map((e) => ({
    id: uid(),
    sourceId: idByKey.get(e.from)!,
    targetId: idByKey.get(e.to)!,
    type: e.type,
    flow: e.flow,
    label: e.label,
  }));

  return { nodes, edges };
}

/**
 * Seed the current user's graph from the example plan.
 * No-op when nodes already exist unless `force` is set.
 * Returns the number of nodes inserted.
 */
export function seedLifeOS(opts: { force?: boolean } = {}): number {
  if (!opts.force && loadNodes().length > 0) return 0;
  const { nodes, edges } = buildLifeOSSeed();
  nodes.forEach(upsertNode);
  edges.forEach(upsertEdge);
  return nodes.length;
}
