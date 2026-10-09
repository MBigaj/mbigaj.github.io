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
  const l = layoutFigure({
    ...fig,
    nodes: fig.nodes.filter((n) => n.id !== 'b'),
    edges: [{ from: 'a', to: 'c', label: 'y', dashed: false }],
  });
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

test('an edge from a node to itself fails', () => {
  expect(() => layoutFigure({ ...fig, edges: [{ from: 'a', to: 'a', dashed: false }] }))
    .toThrow('Figure "f": edge from "a" to itself');
});

test('two nodes with the same id fail', () => {
  expect(() => layoutFigure({ ...fig, nodes: [...fig.nodes, { id: 'a', label: 'A again', col: 2, row: 0 }] }))
    .toThrow('Figure "f": duplicate node id "a"');
});

const row = [
  { id: 'a', label: 'A', col: 0, row: 0 },
  { id: 'b', label: 'B', col: 1, row: 0 },
  { id: 'c', label: 'C', col: 2, row: 0 },
];

test('a straight edge through a third node fails', () => {
  expect(() => layoutFigure({ ...fig, nodes: row, edges: [{ from: 'a', to: 'c', dashed: false }] }))
    .toThrow('Figure "f": edge "a" -> "c" crosses node "b"');
});

test('an edge that bends inside a third node fails', () => {
  expect(() => layoutFigure({ ...fig, edges: [{ from: 'a', to: 'c', dashed: false }] }))
    .toThrow('Figure "f": edge "a" -> "c" crosses node "b"');
});

test('the same pair joined in both directions fails as an overlap', () => {
  const edges = [{ from: 'a', to: 'b', dashed: false }, { from: 'b', to: 'a', dashed: false }];
  expect(() => layoutFigure({ ...fig, edges }))
    .toThrow('Figure "f": edges "a" -> "b" and "b" -> "a" overlap');
});

test('two edges that share part of a segment fail as an overlap', () => {
  const nodes = [
    { id: 'a', label: 'A', col: 0, row: 0 },
    { id: 'd', label: 'D', col: 2, row: 0 },
    { id: 'c', label: 'C', col: 1, row: 1 },
  ];
  const edges = [{ from: 'a', to: 'c', dashed: false }, { from: 'd', to: 'c', dashed: false }];
  expect(() => layoutFigure({ ...fig, nodes, edges }))
    .toThrow('Figure "f": edges "a" -> "c" and "d" -> "c" overlap');
});

test('edges that cross at a point or meet at a node are drawn', () => {
  const nodes = [
    { id: 'w', label: 'W', col: 0, row: 1 },
    { id: 'e', label: 'E', col: 2, row: 1 },
    { id: 'n', label: 'N', col: 1, row: 0 },
    { id: 's', label: 'S', col: 1, row: 2 },
  ];
  const edges = [
    { from: 'w', to: 'e', dashed: false },
    { from: 'n', to: 's', dashed: false },
    { from: 'n', to: 'e', dashed: false },
  ];
  expect(layoutFigure({ ...fig, nodes, edges }).edges).toHaveLength(3);
});
