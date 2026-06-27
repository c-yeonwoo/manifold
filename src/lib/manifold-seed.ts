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
// Seed the graph from the "Life OS — 선순환 시스템" report.
// Turns the BASE → CORE → OUTPUT flywheel (with its feedback loops and the
// "active 3개 제한") into concrete nodes + typed edges so the canvas opens
// pre-populated with the user's real plan instead of an empty board.
// =====================================================================

interface SeedNode {
  key: string; // temp key, resolved to a real id at insert time
  layer: Layer;
  kind: string;
  title: string;
  description: string;
  status: NodeStatus;
  horizon?: string;
  category?: string;
  actions?: string[];
}

interface SeedEdge {
  from: string;
  to: string;
  type: EdgeType;
  flow?: FlowKind;
  label: string;
}

// Active threads are capped at 3 (ACTIVE_LIMIT): 커리어 · 부동산 · 루틴.
const SEED_NODES: SeedNode[] = [
  // 🟢 BASE
  { key: "routine",  layer: "base", kind: "routine",      title: "루틴 · 건강",        description: "수면·공복유산소·헬스·테니스. 무너지면 전체가 무너지는 substrate.", status: "active", horizon: "now",  category: "health", actions: ["공복유산소", "헬스/테니스", "23시 취침"] },
  { key: "mindset",  layer: "base", kind: "mindset",      title: "마인드셋 · 끌어당김",  description: "믿음→일관성→결과. 통제 대신 활동량으로 기댓값을 올린다.",            status: "queued", horizon: "now",  category: "growth" },

  // 🟡 CORE
  { key: "career",   layer: "core", kind: "career",       title: "커리어 (오늘의집→이직)", description: "커머스 통합·프로모션·Lore로 성과 → 네카라쿠배 이직 메리트.",        status: "active", horizon: "28H1", category: "work", actions: ["아침 딥워크 1블록", "Lore/프로모션 진척"] },
  { key: "auto",     layer: "core", kind: "automation",   title: "자동화 역량",          description: "에이전트 팀·n8n·봇. 회사와 사이드에 같은 인프라를 적용.",            status: "queued", horizon: "now",  category: "work" },

  // 🔵 OUTPUT
  { key: "asset",    layer: "output", kind: "asset",        title: "자산 · 부동산",       description: "사이클 분석→경매→내집마련. 생애최초 7억, DSR 40% 스트레스.",        status: "active", horizon: "26H2", category: "wealth", actions: ["임장/경매 분석 30분", "DSR·한도 점검"] },
  { key: "online",   layer: "output", kind: "venture",      title: "온라인 사업 (팔레트·샐비지)", description: "자동화로 무인 운영하는 부수입원. 한계비용 0.",                  status: "queued", horizon: "27H1", category: "wealth" },
  { key: "offline",  layer: "output", kind: "venture",      title: "오프라인 벤처 (카페·혼술바)", description: "고변동 노드. 착수 전 실사 체크리스트 통과가 게이트.",            status: "queued", horizon: "TBD",  category: "wealth" },
  { key: "brand",    layer: "output", kind: "brand",        title: "브랜드 · 콘텐츠 (음악·유튜브)", description: "퍼스널 브랜딩·즐거움. 수입으로 계산하지 않음.",                 status: "queued", horizon: "26H2", category: "play" },
  { key: "relation", layer: "output", kind: "relationship", title: "관계 → 결혼",         description: "소셜 표면적 확대의 부산물. 26Y2H 연애 → 28Y2H 결혼.",              status: "queued", horizon: "27H2", category: "love" },
];

const SEED_EDGES: SeedEdge[] = [
  // BASE → CORE : 에너지·집중·일관성
  { from: "routine",  to: "career",   type: "feeds",      flow: "energy", label: "에너지·집중" },
  { from: "mindset",  to: "routine",  type: "reinforces", flow: "focus",  label: "일관성" },

  // CORE 내부 루프
  { from: "career",   to: "auto",     type: "reinforces", flow: "skill",  label: "상호 강화" },

  // CORE → OUTPUT
  { from: "career",   to: "asset",    type: "feeds",      flow: "cash",   label: "현금흐름" },
  { from: "auto",     to: "online",   type: "feeds",      flow: "skill",  label: "무인 운영" },
  { from: "career",   to: "offline",  type: "feeds",      flow: "time",   label: "시간" },
  { from: "career",   to: "brand",    type: "feeds",      flow: "time",   label: "시간" },

  // OUTPUT → 관계 (소셜 표면적)
  { from: "offline",  to: "relation", type: "feeds",      flow: "social", label: "공간·인연" },
  { from: "brand",    to: "relation", type: "feeds",      flow: "social", label: "유튜브 노출" },
  { from: "routine",  to: "relation", type: "feeds",      flow: "social", label: "테니스·커뮤니티" },

  // OUTPUT → BASE/CORE 피드백 루프
  { from: "online",   to: "asset",    type: "feeds",      flow: "cash",   label: "부수입" },
  { from: "asset",    to: "career",   type: "feedbacks",  flow: "time",   label: "재투자·시간자유" },
  { from: "relation", to: "mindset",  type: "feedbacks",  flow: "energy", label: "안정·동기" },
  { from: "brand",    to: "mindset",  type: "feedbacks",  flow: "energy", label: "자신감" },

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
      category: s.category,
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
 * Seed the current user's graph from the Life OS report.
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
