import { expect, test } from 'vitest';
import { barGeometry, buildTimelineRows, formatPeriod, timelineAxis, type TimelineRole } from '../../src/lib/timeline';

const axis = { from: '2022-01', to: '2026-12' };

test('a two-month role sits at the right place', () => {
  expect(barGeometry('2022-07', '2022-08', axis, '2026-10')).toEqual({ leftPct: 10, widthPct: 3.33 });
});
test('an open role runs to the current month', () => {
  expect(barGeometry('2026-08', null, axis, '2026-10')).toEqual({ leftPct: 91.67, widthPct: 5 });
});
test('a start before the axis is clamped to it', () => {
  expect(barGeometry('2021-10', '2025-03', axis, '2026-10')).toEqual({ leftPct: 0, widthPct: 65 });
});
test('the axis grows with the calendar and bars never pass its end', () => {
  const a = timelineAxis('2027-03');
  expect(a).toEqual({ from: '2022-01', to: '2027-12', years: [2022, 2023, 2024, 2025, 2026, 2027] });
  const g = barGeometry('2026-08', null, a, '2027-03');
  expect(g.leftPct + g.widthPct).toBeLessThanOrEqual(100);
});
test('periods read in words', () => {
  expect(formatPeriod('2022-07', '2022-08')).toBe('Jul 2022 to Aug 2022');
  expect(formatPeriod('2026-08', null)).toBe('Aug 2026 to now');
});

const role = (id: string, employer: string, title: string, start: string, end: string | null, kind: 'role' | 'education' = 'role'): TimelineRole =>
  ({ id, kind, employer, title, start, end });

const roles: TimelineRole[] = [
  role('yg-a', 'YouGov', 'Associate Backend Engineer', '2026-08', null),
  role('yg-g', 'YouGov', 'Graduate Backend Engineer', '2025-08', '2026-08'),
  role('mh-j', 'MH', 'Junior Backend Developer', '2023-09', '2024-10'),
  role('mh-i', 'MH', 'Big Data Intern', '2023-03', '2023-09'),
  role('ws', 'WithSecure', 'Data Scientist Intern', '2022-09', '2022-12'),
  role('bl', 'Blulog', 'Full-stack Developer', '2022-07', '2022-08'),
  role('cdv', 'Collegium Da Vinci', 'BTech Computer Science', '2021-10', '2025-03', 'education'),
];

test('consecutive roles at one employer merge, trimming repeated words', () => {
  const rows = buildTimelineRows(roles);
  const yg = rows.find((r) => r.employer === 'YouGov')!;
  expect(yg.label).toBe('YouGov · Graduate, then Associate Backend Engineer');
  expect([yg.start, yg.end]).toEqual(['2025-08', null]);
});
test('titles with nothing in common keep their full text', () => {
  const mh = buildTimelineRows(roles).find((r) => r.employer === 'MH')!;
  expect(mh.label).toBe('MH · Big Data Intern, then Junior Backend Developer');
  expect([mh.start, mh.end]).toEqual(['2023-03', '2024-10']);
});
test('a single role is its own row', () => {
  const ws = buildTimelineRows(roles).find((r) => r.employer === 'WithSecure')!;
  expect(ws.label).toBe('WithSecure · Data Scientist Intern');
  expect(ws.titles).toEqual(['Data Scientist Intern']);
});
test('roles at one employer separated by another employer stay separate', () => {
  const rows = buildTimelineRows([
    role('a1', 'Acme', 'Intern', '2022-01', '2022-06'),
    role('b', 'Beta', 'Developer', '2022-07', '2022-12'),
    role('a2', 'Acme', 'Engineer', '2023-01', '2023-06'),
  ]);
  expect(rows.map((r) => r.label)).toEqual(['Acme · Engineer', 'Beta · Developer', 'Acme · Intern']);
});
test('rows run newest first with education last', () => {
  expect(buildTimelineRows(roles).map((r) => r.employer)).toEqual([
    'YouGov', 'MH', 'WithSecure', 'Blulog', 'Collegium Da Vinci',
  ]);
  expect(buildTimelineRows(roles).at(-1)!.kind).toBe('education');
});
