import type { Layer, ManifoldNode } from "@/lib/manifold";

export const W = 980;
export const H = 680;
export const NODE_W = 158;
export const NODE_H = 56;

const LAYER_ORDER: Layer[] = ["base", "core", "output"];
// vertical center of each layer band
export const LAYER_Y: Record<Layer, number> = {
  base: 110,
  core: 330,
  output: 560,
};
export const LAYER_BAND: Record<Layer, { top: number; height: number }> = {
  base: { top: 36, height: 150 },
  core: { top: 246, height: 168 },
  output: { top: 452, height: 196 },
};

export interface Placed {
  node: ManifoldNode;
  x: number; // center
  y: number; // center
}

/**
 * Layered layout: nodes sit in their layer band, distributed horizontally.
 * Honors a node's manual (x, y) when present, otherwise auto-spreads.
 */
export function layoutNodes(nodes: ManifoldNode[]): Map<string, Placed> {
  const map = new Map<string, Placed>();
  const margin = 96;
  const usable = W - margin * 2;

  for (const layer of LAYER_ORDER) {
    const inLayer = nodes
      .filter((n) => n.layer === layer && n.status !== "archived")
      .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt));
    const n = inLayer.length;
    inLayer.forEach((node, i) => {
      const autoX = margin + (n === 1 ? usable / 2 : (i / (n - 1)) * usable);
      const x = node.x ?? autoX;
      const y = node.y ?? LAYER_Y[layer];
      map.set(node.id, { node, x, y });
    });
  }
  return map;
}

/** Point on the border of `to`'s box, along the segment from `from` to `to`. */
export function clipToBox(
  from: { x: number; y: number },
  to: { x: number; y: number },
  hw = NODE_W / 2,
  hh = NODE_H / 2
): { x: number; y: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return to;
  const sx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const k = Math.min(sx, sy);
  return { x: to.x - dx * k, y: to.y - dy * k };
}
