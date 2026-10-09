import { expect, test } from 'vitest';
import skills from '../../src/data/skills.json';
import roles from '../../src/data/roles.json';

test('there are 24 skills with unique ids', () => {
  expect(skills).toHaveLength(24);
  expect(new Set(skills.map((s) => s.id)).size).toBe(24);
});

test('every skill a role names exists', () => {
  const ids = new Set(skills.map((s) => s.id));
  for (const r of roles) for (const s of r.skills) expect(ids.has(s), `${r.id} -> ${s}`).toBe(true);
});

test('roles hold six jobs and one degree, and nothing mentions PHP', () => {
  expect(roles.filter((r) => r.kind === 'role')).toHaveLength(6);
  expect(roles.filter((r) => r.kind === 'education')).toHaveLength(1);
  expect(JSON.stringify(roles) + JSON.stringify(skills)).not.toMatch(/php|yii/i);
});
