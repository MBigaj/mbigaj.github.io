export type EvidenceItem = {
  kind: 'project' | 'work' | 'role';
  id: string;
  title: string;
  href: string;
};

export type EvidenceSource = EvidenceItem & { skills: string[] };

const KIND_ORDER: EvidenceItem['kind'][] = ['project', 'work', 'role'];

export function buildEvidence(
  skillIds: string[],
  sources: EvidenceSource[],
): Record<string, EvidenceItem[]> {
  const known = new Set(skillIds);
  for (const s of sources) {
    for (const id of s.skills) {
      if (!known.has(id)) {
        throw new Error(`Unknown skill "${id}" referenced by ${s.kind} "${s.id}"`);
      }
    }
  }
  const out: Record<string, EvidenceItem[]> = {};
  for (const id of skillIds) {
    out[id] = KIND_ORDER.flatMap((kind) =>
      sources
        .filter((s) => s.kind === kind && s.skills.includes(id))
        .map(({ kind, id, title, href }) => ({ kind, id, title, href })),
    );
  }
  return out;
}
