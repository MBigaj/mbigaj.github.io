import { describe, it, expect } from 'vitest';
import { predict, preprocess, type DigitModel } from '../../src/lib/digits';

const tanh = Math.tanh;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

describe('predict', () => {
  it('runs each layer as in · W + b and then its activation', () => {
    // 4 → 3 (tanh) → 2 (sigmoid)
    const model: DigitModel = {
      layers: [
        {
          weights: [
            [0.1, -0.2, 0.3],
            [0.4, 0.5, -0.6],
            [-0.7, 0.8, 0.9],
            [1.0, -1.1, 1.2],
          ],
          bias: [0.05, -0.05, 0.1],
        },
        {
          weights: [
            [0.3, -0.4],
            [-0.5, 0.6],
            [0.7, 0.2],
          ],
          bias: [-0.1, 0.2],
        },
      ],
      activations: ['tanh', 'sigmoid'],
    };
    const x = [1, 0.5, -1, 2];
    // Worked by hand:
    // h0 = tanh(0.1 + 0.2 + 0.7 + 2.0 + 0.05) = tanh(3.05)
    // h1 = tanh(-0.2 + 0.25 - 0.8 - 2.2 - 0.05) = tanh(-3.0)
    // h2 = tanh(0.3 - 0.3 - 0.9 + 2.4 + 0.1) = tanh(1.6)
    const h = [tanh(3.05), tanh(-3.0), tanh(1.6)];
    const o0 = sigmoid(h[0] * 0.3 + h[1] * -0.5 + h[2] * 0.7 - 0.1);
    const o1 = sigmoid(h[0] * -0.4 + h[1] * 0.6 + h[2] * 0.2 + 0.2);
    const out = predict(model, x);
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(o0, 6);
    expect(out[1]).toBeCloseTo(o1, 6);
  });
});

function image(width: number, height: number, fill?: (x: number, y: number) => boolean) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (fill?.(x, y)) data.set([255, 255, 255, 255], (y * width + x) * 4);
  return { width, height, data };
}

function stats(v: Float32Array) {
  let sum = 0, sx = 0, sy = 0;
  let minX = 28, minY = 28, maxX = -1, maxY = -1;
  for (let y = 0; y < 28; y++)
    for (let x = 0; x < 28; x++) {
      const p = v[y * 28 + x];
      if (p <= 0) continue;
      sum += p; sx += p * x; sy += p * y;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  return { sum, cx: sx / sum, cy: sy / sum, w: maxX - minX + 1, h: maxY - minY + 1 };
}

describe('preprocess', () => {
  it('returns 784 zeros for an empty pad', () => {
    const v = preprocess(image(280, 280));
    expect(v).toBeInstanceOf(Float32Array);
    expect(v).toHaveLength(784);
    expect(v.every((p) => p === 0)).toBe(true);
  });

  it('scales the ink to 20 px on its longer side and centres its mass at (14, 14)', () => {
    const v = preprocess(image(280, 280, (x, y) => x < 40 && y < 40));
    const s = stats(v);
    expect(Math.max(s.w, s.h)).toBeGreaterThanOrEqual(19);
    expect(Math.max(s.w, s.h)).toBeLessThanOrEqual(21);
    expect(Math.abs(s.cx - 14)).toBeLessThanOrEqual(1);
    expect(Math.abs(s.cy - 14)).toBeLessThanOrEqual(1);
    expect(Math.max(...v)).toBeLessThanOrEqual(1);
  });

  it('keeps the aspect ratio of a tall stroke', () => {
    const v = preprocess(image(280, 280, (x, y) => x >= 130 && x < 150 && y >= 40 && y < 240));
    const s = stats(v);
    expect(s.h).toBeGreaterThanOrEqual(19);
    expect(s.h).toBeLessThanOrEqual(21);
    expect(s.w).toBeLessThanOrEqual(3);
    expect(Math.abs(s.cx - 14)).toBeLessThanOrEqual(1);
  });
});
