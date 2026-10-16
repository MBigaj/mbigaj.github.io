// Pure layout for architecture diagrams. No Astro imports, so Vitest can load it.
// Figure mirrors the zod `figure` schema in src/content.config.ts.
export type Figure = {
  id: string;
  caption: string;
  nodes: { id: string; label: string; sub?: string; col: number; row: number }[];
  edges: { from: string; to: string; label?: string; dashed: boolean }[];
};

export const CELL = { w: 200, h: 80, gapX: 152, gapY: 112, pad: 48 };

export type Laid = {
  width: number;
  height: number;
  nodes: { id: string; label: string; sub?: string; x: number; y: number; w: number; h: number }[];
  edges: {
    points: [number, number][];
    label?: string;
    labelAt?: [number, number];
    dashed: boolean;
  }[];
};

const LABEL_OFFSET = 12;

type Point = [number, number];
type Box = { id: string; x: number; y: number; w: number; h: number };

/** Edges only run along the axes, so a segment is one fixed coordinate and a span on the other axis. */
function span([a, b]: [Point, Point]): { horizontal: boolean; at: number; lo: number; hi: number } {
  const horizontal = a[1] === b[1];
  const [p, q] = horizontal ? [a[0], b[0]] : [a[1], b[1]];
  return { horizontal, at: horizontal ? a[1] : a[0], lo: Math.min(p, q), hi: Math.max(p, q) };
}

function segments(points: Point[]): [Point, Point][] {
  return points.slice(1).map((p, i) => [points[i], p]);
}

/** True when the segment runs through the inside of the box; touching its outline does not count. */
function passesThrough(segment: [Point, Point], box: Box): boolean {
  const s = span(segment);
  const [start, size, crossStart, crossSize] = s.horizontal
    ? [box.x, box.w, box.y, box.h]
    : [box.y, box.h, box.x, box.w];
  return s.at > crossStart && s.at < crossStart + crossSize && s.hi > start && s.lo < start + size;
}

/** True when two segments lie on one line and share more than a single point. */
function overlap(a: [Point, Point], b: [Point, Point]): boolean {
  const s = span(a);
  const t = span(b);
  return s.horizontal === t.horizontal && s.at === t.at && Math.min(s.hi, t.hi) > Math.max(s.lo, t.lo);
}

/**
 * Routing is one straight run or a single bend, with no way round an obstacle. So a figure
 * that would come out misleading is refused: a repeated node id, two nodes in one cell, an
 * edge from a node to itself, an edge through another node, or two edges on the same stretch.
 */
export function layoutFigure(fig: Figure): Laid {
  const { w, h, gapX, gapY, pad } = CELL;

  const ids = new Set<string>();
  const cells = new Map<string, string>();
  const nodes = fig.nodes.map((n) => {
    if (ids.has(n.id)) throw new Error(`Figure "${fig.id}": duplicate node id "${n.id}"`);
    ids.add(n.id);
    const key = `${n.col},${n.row}`;
    const other = cells.get(key);
    if (other !== undefined) {
      throw new Error(`Figure "${fig.id}": nodes "${other}" and "${n.id}" share a cell`);
    }
    cells.set(key, n.id);
    return { id: n.id, label: n.label, sub: n.sub, x: pad + n.col * (w + gapX), y: pad + n.row * (h + gapY), w, h };
  });

  const find = (id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) throw new Error(`Figure "${fig.id}": edge points at unknown node "${id}"`);
    return node;
  };

  const edges = fig.edges.map((e) => {
    if (e.from === e.to) throw new Error(`Figure "${fig.id}": edge from "${e.from}" to itself`);
    const a = find(e.from);
    const b = find(e.to);
    const acx = a.x + a.w / 2;
    const acy = a.y + a.h / 2;
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    let points: Point[];
    if (a.y === b.y) {
      const right = bcx > acx;
      points = [[right ? a.x + a.w : a.x, acy], [right ? b.x : b.x + b.w, bcy]];
    } else if (a.x === b.x) {
      const down = bcy > acy;
      points = [[acx, down ? a.y + a.h : a.y], [bcx, down ? b.y : b.y + b.h]];
    } else {
      const startX = bcx > acx ? a.x + a.w : a.x;
      const endY = bcy > acy ? b.y : b.y + b.h;
      points = [[startX, acy], [bcx, acy], [bcx, endY]];
    }
    for (const segment of segments(points)) {
      const hit = nodes.find((n) => n !== a && n !== b && passesThrough(segment, n));
      if (hit) {
        throw new Error(`Figure "${fig.id}": edge "${e.from}" -> "${e.to}" crosses node "${hit.id}"`);
      }
    }
    const [p0, p1] = points;
    const horizontal = p0[1] === p1[1];
    const labelAt: Point = horizontal
      ? [(p0[0] + p1[0]) / 2, p0[1] - LABEL_OFFSET]
      : [p0[0] + LABEL_OFFSET, (p0[1] + p1[1]) / 2];
    return { points, label: e.label, labelAt: e.label ? labelAt : undefined, dashed: e.dashed };
  });

  const runs = edges.map((e) => segments(e.points));
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      if (runs[i].some((s) => runs[j].some((t) => overlap(s, t)))) {
        const [e, f] = [fig.edges[i], fig.edges[j]];
        throw new Error(
          `Figure "${fig.id}": edges "${e.from}" -> "${e.to}" and "${f.from}" -> "${f.to}" overlap`,
        );
      }
    }
  }

  const cols = Math.max(0, ...fig.nodes.map((n) => n.col)) + 1;
  const rows = Math.max(0, ...fig.nodes.map((n) => n.row)) + 1;
  return {
    width: pad * 2 + cols * w + (cols - 1) * gapX,
    height: pad * 2 + rows * h + (rows - 1) * gapY,
    nodes,
    edges,
  };
}
