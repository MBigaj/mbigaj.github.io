// The pure parts of the digit demo: framing a drawing the way MNIST digits are framed,
// and the network's forward pass. No DOM here, so both run under Vitest.

export type Activation = 'tanh' | 'sigmoid';

export interface DigitModel {
  /** weights[i][j] connects input i to output j; out = in · W + b. */
  layers: { weights: number[][]; bias: number[] }[];
  activations: Activation[];
}

/** The shape of ImageData: RGBA bytes, row by row. */
export interface Pixels {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

const SIZE = 28;
const BOX = 20;

const activate: Record<Activation, (x: number) => number> = {
  tanh: Math.tanh,
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
};

export function predict(model: DigitModel, input: ArrayLike<number>): number[] {
  let x: ArrayLike<number> = input;
  model.layers.forEach(({ weights, bias }, l) => {
    const f = activate[model.activations[l]];
    const out = bias.slice();
    for (let i = 0; i < weights.length; i++) {
      const xi = x[i];
      if (xi === 0) continue;
      const row = weights[i];
      for (let j = 0; j < out.length; j++) out[j] += xi * row[j];
    }
    x = out.map(f);
  });
  return Array.from(x);
}

/**
 * Area-weighted resampling of `n` source cells onto `m` target cells: for each target cell,
 * the source cells it covers and how much of each. This is what smoothed downscaling does.
 */
function spans(n: number, m: number): [number, number][][] {
  const step = n / m;
  return Array.from({ length: m }, (_, t) => {
    const a = t * step;
    const b = a + step;
    const cells: [number, number][] = [];
    for (let s = Math.floor(a); s < Math.min(n, Math.ceil(b)); s++) {
      const w = Math.min(b, s + 1) - Math.max(a, s);
      if (w > 0) cells.push([s, w / step]);
    }
    return cells;
  });
}

/**
 * Turns a drawing (light ink on a dark or transparent pad) into the network's input: the ink's
 * bounding box scaled so its longer side is 20 px, on a 28 × 28 black field, shifted so the
 * ink's centre of mass sits at (14, 14). Values run from 0 (no ink) to 1, row by row.
 */
export function preprocess(img: Pixels): Float32Array {
  const { width, height, data } = img;
  const out = new Float32Array(SIZE * SIZE);

  const ink = new Float32Array(width * height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      const v = ((0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) / 255) * (data[p + 3] / 255);
      if (v <= 0) continue;
      ink[y * width + x] = v;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  if (maxX < 0) return out;

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const scale = BOX / Math.max(bw, bh);
  const tw = Math.max(1, Math.round(bw * scale));
  const th = Math.max(1, Math.round(bh * scale));
  const sx = spans(bw, tw);
  const sy = spans(bh, th);

  // Scale the box, rows first, then columns.
  const rows = new Float32Array(tw * bh);
  for (let y = 0; y < bh; y++)
    for (let t = 0; t < tw; t++) {
      let v = 0;
      for (const [s, w] of sx[t]) v += ink[(minY + y) * width + minX + s] * w;
      rows[y * tw + t] = v;
    }
  const small = new Float32Array(tw * th);
  let mass = 0, mx = 0, my = 0;
  for (let t = 0; t < th; t++)
    for (let x = 0; x < tw; x++) {
      let v = 0;
      for (const [s, w] of sy[t]) v += rows[s * tw + x] * w;
      v = Math.min(1, v);
      small[t * tw + x] = v;
      mass += v;
      mx += v * x;
      my += v * t;
    }

  // Place it so the centre of mass lands on (14, 14).
  const ox = Math.round(SIZE / 2 - mx / mass);
  const oy = Math.round(SIZE / 2 - my / mass);
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      const X = x + ox;
      const Y = y + oy;
      if (X >= 0 && X < SIZE && Y >= 0 && Y < SIZE) out[Y * SIZE + X] = small[y * tw + x];
    }
  return out;
}
