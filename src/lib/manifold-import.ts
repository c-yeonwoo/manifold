import {
  uid,
  loadNodes,
  loadEdges,
  deleteNode,
  upsertNode,
  upsertEdge,
  type Layer,
  type ManifoldNode,
  type ManifoldEdge,
  type EdgeType,
  type FlowKind,
} from "./manifold";

// =====================================================================
// Import a markdown life-plan report into the graph.
//
// Targets the format this assistant emits (Life OS style): a `mermaid`
// flowchart whose `subgraph`s are the BASE/CORE/OUTPUT layers and whose
// inner node defs (`R["루틴·건강"]`) are the nodes, plus typed edges
// (`A ==>|label| B`). Falls back to `####` headings under `### LAYER`
// sections when no mermaid block is present.
//
// Pure client-side; no schema dependency.
// =====================================================================

export interface ParsedReport {
  nodes: ManifoldNode[];
  edges: ManifoldEdge[];
  warnings: string[];
}

const stripDecoration = (s: string) =>
  s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, "") // emoji/symbols
    .replace(/^[#>\-*\s]+/, "")
    .replace(/\*\*/g, "")
    .trim();

const layerFromText = (t: string): Layer | null => {
  const s = t.toUpperCase();
  if (/BASE|기반/.test(s)) return "base";
  if (/CORE|엔진/.test(s)) return "core";
  if (/OUTPUT|OUT\b|산출/.test(s)) return "output";
  return null;
};

const KIND_RULES: [RegExp, string][] = [
  [/루틴|건강|운동|수면/, "routine"],
  [/마인드셋|끌어당김|멘탈/, "mindset"],
  [/커리어|이직|회사|직무/, "career"],
  [/자동화|에이전트|인프라|무인/, "automation"],
  [/자산|부동산|집|대출|경매/, "asset"],
  [/사업|팔레트|샐비지|카페|벤처|혼술/, "venture"],
  [/브랜드|콘텐츠|유튜브|음악|영상/, "brand"],
  [/관계|결혼|연애|소셜/, "relationship"],
];
const kindFromTitle = (t: string): string => {
  for (const [re, k] of KIND_RULES) if (re.test(t)) return k;
  return "goal";
};

const FLOW_RULES: [RegExp, FlowKind][] = [
  [/에너지|집중|컨디션/, "energy"],
  [/현금|돈|부수입|수익|자본|재투자/, "cash"],
  [/시간/, "time"],
  [/인연|노출|커뮤니티|표면|만남|공간|소셜/, "social"],
  [/역량|스킬|전문성|무인/, "skill"],
  [/일관성|자신감|동기|안정/, "focus"],
];
const flowFromLabel = (label: string): FlowKind | undefined => {
  for (const [re, f] of FLOW_RULES) if (re.test(label)) return f;
  return undefined;
};

const edgeTypeFromArrow = (arrow: string, label: string): EdgeType => {
  if (/선행|앞서|먼저|실행\s*후|선결/.test(label)) return "gates";
  if (arrow.startsWith("<") && arrow.endsWith(">")) return "reinforces";
  if (arrow.includes(".")) return "feedbacks"; // dashed
  return "feeds";
};

function extractMermaid(md: string): string | null {
  const m = md.match(/```mermaid\s*([\s\S]*?)```/i);
  if (!m) return null;
  if (!/flowchart|graph/i.test(m[1])) return null;
  return m[1];
}

function parseMermaid(src: string): ParsedReport {
  const warnings: string[] = [];
  const lines = src.split("\n");

  const layerOfNode = new Map<string, Layer>();
  const titleOfNode = new Map<string, string>();
  let currentLayer: Layer | null = null;
  const layerStack: (Layer | null)[] = [];

  // ID["title"] / ID[title] — square brackets only, so inner ()/· don't truncate.
  const NODE_DEF = /([A-Za-z0-9_]+)\s*\[\s*"?(.+?)"?\s*\]/g;
  const EDGE_RE = /^\s*([A-Za-z0-9_]+)\s*(<?[-=.]+>)\s*(?:\|([^|]*)\|)?\s*([A-Za-z0-9_]+)\s*$/;

  const subgraphIds = new Set<string>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^flowchart|^graph|^direction/i.test(line)) continue;

    if (/^subgraph\b/i.test(line)) {
      const idm = line.match(/^subgraph\s+([A-Za-z0-9_]+)/i);
      const lyr = layerFromText(line);
      if (idm) subgraphIds.add(idm[1]);
      layerStack.push(currentLayer);
      currentLayer = lyr ?? currentLayer;
      continue;
    }
    if (/^end\b/i.test(line)) {
      currentLayer = layerStack.pop() ?? null;
      continue;
    }

    // node definitions on this line (not the subgraph header)
    let nm: RegExpExecArray | null;
    NODE_DEF.lastIndex = 0;
    while ((nm = NODE_DEF.exec(line))) {
      const id = nm[1];
      const title = stripDecoration(nm[2]);
      if (!title) continue;
      titleOfNode.set(id, title);
      if (currentLayer) layerOfNode.set(id, currentLayer);
    }
  }

  // pass 2: edges
  interface RawEdge { s: string; t: string; type: EdgeType; flow?: FlowKind; label: string; }
  const rawEdges: RawEdge[] = [];
  let skippedSubgraph = 0;
  for (const raw of lines) {
    const em = raw.match(EDGE_RE);
    if (!em) continue;
    const [, s, arrow, labelRaw, t] = em;
    const label = (labelRaw ?? "").trim();
    // endpoints touching a subgraph (layer) can't resolve to a single node
    if (subgraphIds.has(s) || subgraphIds.has(t)) {
      skippedSubgraph++;
      continue;
    }
    if (!titleOfNode.has(s) || !titleOfNode.has(t)) continue;
    rawEdges.push({ s, t, type: edgeTypeFromArrow(arrow, label), flow: flowFromLabel(label), label });
  }
  if (skippedSubgraph > 0) {
    warnings.push(`레이어(subgraph) 간 연결 ${skippedSubgraph}개는 특정 노드로 해석할 수 없어 건너뜀 — 캔버스에서 직접 연결하세요.`);
  }

  // build model
  const now = new Date().toISOString();
  const idByKey = new Map<string, string>();
  const nodes: ManifoldNode[] = [];
  let i = 0;
  for (const [key, title] of titleOfNode) {
    const layer = layerOfNode.get(key) ?? "core";
    if (!layerOfNode.has(key)) warnings.push(`"${title}" 노드의 레이어를 못 찾아 CORE로 배치.`);
    const id = uid();
    idByKey.set(key, id);
    nodes.push({
      id,
      layer,
      kind: kindFromTitle(title),
      title,
      description: "",
      status: "queued",
      priority: titleOfNode.size - i++,
      vision: "",
      actions: [],
      meta: { imported: "report" },
      createdAt: now,
    });
  }

  const edges: ManifoldEdge[] = rawEdges.map((e) => ({
    id: uid(),
    sourceId: idByKey.get(e.s)!,
    targetId: idByKey.get(e.t)!,
    type: e.type,
    flow: e.flow,
    label: e.label,
  }));

  return { nodes, edges, warnings };
}

// Fallback: nodes from `#### ...` headings under `### <LAYER>` sections.
function parseHeadings(md: string): ParsedReport {
  const warnings: string[] = ["mermaid flowchart를 못 찾아 헤딩 구조로만 노드를 추출(엣지 없음)."];
  const lines = md.split("\n");
  const now = new Date().toISOString();
  const nodes: ManifoldNode[] = [];
  let currentLayer: Layer | null = null;
  let i = 0;
  for (const raw of lines) {
    const line = raw.trim();
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      currentLayer = layerFromText(h3[1]) ?? currentLayer;
      continue;
    }
    const h4 = line.match(/^####\s+(.*)$/);
    if (h4 && currentLayer) {
      const title = stripDecoration(h4[1]);
      if (!title) continue;
      nodes.push({
        id: uid(),
        layer: currentLayer,
        kind: kindFromTitle(title),
        title,
        description: "",
        status: "queued",
        priority: 100 - i++,
        vision: "",
        actions: [],
        meta: { imported: "report" },
        createdAt: now,
      });
    }
  }
  if (nodes.length === 0) warnings.push("노드를 하나도 추출하지 못했습니다.");
  return { nodes, edges: [], warnings };
}

export function parseReport(md: string): ParsedReport {
  const mermaid = extractMermaid(md);
  if (mermaid) {
    const r = parseMermaid(mermaid);
    if (r.nodes.length > 0) return r;
  }
  return parseHeadings(md);
}

/** Import a parsed report into the live graph. `replace` clears existing nodes first. */
export function importReport(md: string, opts: { replace?: boolean } = {}): ParsedReport {
  const parsed = parseReport(md);
  if (opts.replace) {
    for (const n of [...loadNodes()]) deleteNode(n.id);
    for (const e of [...loadEdges()]) {
      // edges already cascade with their nodes, but clear any orphans defensively
      void e;
    }
  }
  parsed.nodes.forEach(upsertNode);
  parsed.edges.forEach(upsertEdge);
  return parsed;
}
