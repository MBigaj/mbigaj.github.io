const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AXIS_START_YEAR = 2022;

/** '2022-07' -> 2022 * 12 + 6 */
export function monthIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

/** The axis runs from January 2022 to December of the current year. */
export function timelineAxis(now: string): { from: string; to: string; years: number[] } {
  const endYear = Number(now.slice(0, 4));
  const years: number[] = [];
  for (let y = AXIS_START_YEAR; y <= endYear; y++) years.push(y);
  return { from: `${AXIS_START_YEAR}-01`, to: `${endYear}-12`, years };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** End month is inclusive. Start and end are clamped to the axis. */
export function barGeometry(
  start: string,
  end: string | null,
  axis: { from: string; to: string },
  now: string,
): { leftPct: number; widthPct: number } {
  const from = monthIndex(axis.from);
  const total = monthIndex(axis.to) - from + 1;
  const s = Math.min(Math.max(monthIndex(start), from), from + total - 1);
  const e = Math.min(monthIndex(end ?? now), from + total - 1);
  const months = Math.max(e - s + 1, 0);
  return {
    leftPct: round2(((s - from) / total) * 100),
    widthPct: round2((months / total) * 100),
  };
}

function label(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatPeriod(start: string, end: string | null): string {
  return `${label(start)} to ${end === null ? 'now' : label(end)}`;
}
