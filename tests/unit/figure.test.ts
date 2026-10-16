import { expect, test } from 'vitest';
import { layoutFigure } from '../../src/lib/figure';

const fig = {
  id: 'f',
  caption: 'c',
  nodes: [
    { id: 'a', label: 'A', col: 0, row: 0 },
    { id: 'b', label: 'B', col: 1, row: 0 },
    { id: 'c', label: 'C', col: 1, row: 1 },
  ],
  edges: [
    { from: 'a', to: 'b', label: 'x', dashed: false },
    { from: 'b', to: 'c', dashed: true },
  ],
};

test('places nodes on the grid and sizes the sheet', () => {
  const l = layoutFigure(fig);
  expect(l.nodes.find((n) => n.id === 'b')).toMatchObject({ x: 400, y: 48, w: 200, h: 80 });
  expect(l).toMatchObject({ width: 648, height: 368 });
});

test('same-row edges run side to side, same-column edges top to bottom', () => {
  const l = layoutFigure(fig);
  expect(l.edges[0].points).toEqual([[248, 88], [400, 88]]);
  expect(l.edges[1].points).toEqual([[500, 128], [500, 240]]);
  expect(l.edges[1].dashed).toBe(true);
});

test('edges that share neither row nor column bend once, with the label beside the first segment', () => {
  const l = layoutFigure({ ...fig, edges: [{ from: 'a', to: 'c', label: 'y', dashed: false }] });
  expect(l.edges[0].points).toEqual([[248, 88], [500, 88], [500, 240]]);
  expect(l.edges[0].labelAt).toEqual([374, 76]);
});

test('going up and leftwards mirrors the routing', () => {
  const l = layoutFigure({ ...fig, edges: [{ from: 'c', to: 'b', dashed: false }, { from: 'c', to: 'a', label: 'z', dashed: false }] });
  expect(l.edges[0].points).toEqual([[500, 240], [500, 128]]);
  expect(l.edges[1].points).toEqual([[400, 280], [148, 280], [148, 128]]);
});

test('an edge to a missing node fails, naming the figure and the node', () => {
  expect(() => layoutFigure({ ...fig, edges: [{ from: 'a', to: 'zz', dashed: false }] }))
    .toThrow(/Figure "f": edge points at unknown node "zz"/);
});

test('two nodes in one cell fail', () => {
  expect(() => layoutFigure({ ...fig, nodes: [...fig.nodes, { id: 'd', label: 'D', col: 0, row: 0 }] }))
    .toThrow(/Figure "f": nodes "a" and "d" share a cell/);
});
