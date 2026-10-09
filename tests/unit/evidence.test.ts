import { expect, test } from 'vitest';
import { buildEvidence, type EvidenceSource } from '../../src/lib/evidence';

const src: EvidenceSource[] = [
  { kind: 'role', id: 'r1', title: 'Engineer, Acme', href: '/work/#r1', skills: ['python'] },
  { kind: 'project', id: 'p1', title: 'P1', href: '/projects/p1/', skills: ['python', 'numpy'] },
  { kind: 'work', id: 'w1', title: 'W1', href: '/work/#w1', skills: ['python'] },
];

test('orders evidence as projects, then work, then roles', () => {
  const ev = buildEvidence(['python', 'numpy', 'redis'], [...src]);
  expect(ev.python.map((e) => e.id)).toEqual(['p1', 'w1', 'r1']);
  expect(ev.numpy.map((e) => e.id)).toEqual(['p1']);
});

test('a skill nobody uses gets an empty list', () => {
  expect(buildEvidence(['redis'], [...src].map((s) => ({ ...s, skills: [] }))).redis).toEqual([]);
});

test('an unknown skill id fails loudly, naming the id and the entry', () => {
  expect(() => buildEvidence(['python'], [{ ...src[1], skills: ['pyhton'] }]))
    .toThrow(/Unknown skill "pyhton" referenced by project "p1"/);
});
