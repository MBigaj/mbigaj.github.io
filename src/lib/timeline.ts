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

export type TimelineRole = {
  id: string;
  kind: 'role' | 'education';
  employer: string;
  title: string;
  start: string;
  end: string | null;
};

export type TimelineRow = {
  key: string;
  kind: 'role' | 'education';
  employer: string;
  titles: string[];
  label: string;
  start: string;
  end: string | null;
};

/** Join titles oldest first, dropping words shared at the end of every title from all but the last. */
function joinTitles(titles: string[]): string {
  if (titles.length === 1) return titles[0];
  const words = titles.map((t) => t.split(' '));
  const maxShared = Math.min(...words.map((w) => w.length)) - 1;
  let shared = 0;
  while (
    shared < maxShared &&
    words.every((w) => w[w.length - 1 - shared] === words[0][words[0].length - 1 - shared])
  ) {
    shared++;
  }
  const trimmed = titles.map((t, i) =>
    i < titles.length - 1 ? words[i].slice(0, words[i].length - shared).join(' ') : t,
  );
  const unambiguous = shared > 0 && new Set(trimmed).size === trimmed.length;
  return (unambiguous ? trimmed : titles).join(', then ');
}

/**
 * Roles at one employer that follow one another form one row. Rows run newest
 * first, with education rows last.
 */
export function buildTimelineRows(roles: TimelineRole[]): TimelineRow[] {
  const oldestFirst = [...roles].sort((a, b) => monthIndex(a.start) - monthIndex(b.start));
  const groups: TimelineRole[][] = [];
  for (const r of oldestFirst) {
    const last = groups[groups.length - 1];
    const prev = last?.[last.length - 1];
    if (prev && r.kind === 'role' && prev.kind === 'role' && prev.employer === r.employer) {
      last.push(r);
    } else {
      groups.push([r]);
    }
  }
  const rows = groups.map((g): TimelineRow => {
    const titles = g.map((r) => r.title);
    const employer = g[0].employer;
    return {
      key: g[0].id,
      kind: g[0].kind,
      employer,
      titles,
      label: `${employer} · ${joinTitles(titles)}`,
      start: g[0].start,
      end: g[g.length - 1].end,
    };
  });
  const rank = (r: TimelineRow) => (r.kind === 'education' ? 1 : 0);
  return rows.sort((a, b) => rank(a) - rank(b) || monthIndex(b.start) - monthIndex(a.start));
}
