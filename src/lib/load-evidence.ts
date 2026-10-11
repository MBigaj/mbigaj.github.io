import { getCollection } from 'astro:content';
import { buildEvidence, type EvidenceItem, type EvidenceSource } from './evidence';

export async function loadEvidence(): Promise<Record<string, EvidenceItem[]>> {
  const [skills, projects, work, roles] = await Promise.all([
    getCollection('skills'),
    getCollection('projects'),
    getCollection('work'),
    getCollection('roles'),
  ]);
  const sources: EvidenceSource[] = [
    ...projects.map((p) => ({
      kind: 'project' as const,
      id: p.id,
      title: p.data.title,
      href: `/projects/${p.id}/`,
      skills: p.data.skills.map((s) => s.id),
    })),
    ...work.map((w) => ({
      kind: 'work' as const,
      id: w.id,
      title: w.data.title,
      href: `/work/#${w.id}`,
      skills: w.data.skills.map((s) => s.id),
    })),
    ...roles
      .filter((r) => r.data.kind === 'role')
      .map((r) => ({
        kind: 'role' as const,
        id: r.data.id,
        title: `${r.data.title}, ${r.data.employer}`,
        href: `/work/#${r.data.id}`,
        skills: r.data.skills.map((s) => s.id),
      })),
  ];
  return buildEvidence(
    skills.map((s) => s.data.id),
    sources,
  );
}
