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

export function layoutFigure(fig: Figure): Laid {
  const { w, h, gapX, gapY, pad } = CELL;

  const cells = new Map<string, string>();
  const nodes = fig.nodes.map((n) => {
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
    const a = find(e.from);
    const b = find(e.to);
    const acx = a.x + a.w / 2;
    const acy = a.y + a.h / 2;
    const bcx = b.x + b.w / 2;
    const bcy = b.y + b.h / 2;
    let points: [number, number][];
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
    const [p0, p1] = points;
    const horizontal = p0[1] === p1[1];
    const labelAt: [number, number] = horizontal
      ? [(p0[0] + p1[0]) / 2, p0[1] - LABEL_OFFSET]
      : [p0[0] + LABEL_OFFSET, (p0[1] + p1[1]) / 2];
    return { points, label: e.label, labelAt: e.label ? labelAt : undefined, dashed: e.dashed };
  });

  const cols = Math.max(0, ...fig.nodes.map((n) => n.col)) + 1;
  const rows = Math.max(0, ...fig.nodes.map((n) => n.row)) + 1;
  return {
    width: pad * 2 + cols * w + (cols - 1) * gapX,
    height: pad * 2 + rows * h + (rows - 1) * gapY,
    nodes,
    edges,
  };
}
