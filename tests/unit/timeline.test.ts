import { expect, test } from 'vitest';
import { barGeometry, formatPeriod, timelineAxis } from '../../src/lib/timeline';

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
