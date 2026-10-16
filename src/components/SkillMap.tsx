import { useEffect, useRef, useState } from 'react';
import type { EvidenceItem } from '../lib/evidence';

type Tier = 'daily' | 'solid' | 'familiar';
type SkillMapProps = {
  skills: { id: string; name: string; area: string; tier: Tier }[];
  areas: { id: string; label: string }[];
  evidence: Record<string, EvidenceItem[]>;
};

const TIER_WORDS: Record<Tier, string> = { daily: 'Daily', solid: 'Solid', familiar: 'Familiar' };
const KIND_WORDS: Record<EvidenceItem['kind'], string> = { project: 'Project', work: 'Work', role: 'Role' };
const TIER_ORDER: Tier[] = ['daily', 'solid', 'familiar'];
const PREFIX = '#skill-';

export default function SkillMap({ skills, areas, evidence }: SkillMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [interactive, setInteractive] = useState(false);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());

  // Read the hash only after mount so the first client render matches the server HTML.
  useEffect(() => {
    const fromHash = () => {
      let h = '';
      try {
        h = decodeURIComponent(location.hash);
      } catch {
        // A malformed fragment selects nothing.
      }
      const id = h.startsWith(PREFIX) ? h.slice(PREFIX.length) : null;
      setSelected(id && skills.some((s) => s.id === id) ? id : null);
    };
    fromHash();
    setInteractive(true);
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [skills]);

  const choose = (id: string | null) => {
    // Hand focus back to the chip that was selected, since the clear button disappears.
    if (id === null && selected) chipRefs.current.get(selected)?.focus();
    setSelected(id);
    history.replaceState(null, '', id ? `${PREFIX}${id}` : location.pathname + location.search);
  };

  const groups = areas
    .map((a) => ({
      ...a,
      skills: skills
        .filter((s) => s.area === a.id)
        .sort((x, y) => TIER_ORDER.indexOf(x.tier) - TIER_ORDER.indexOf(y.tier)),
    }))
    .filter((g) => g.skills.length > 0);

  const selectedName = skills.find((s) => s.id === selected)?.name;

  return (
    <div className="sm">
      <div role="status" className="sr-only">
        {interactive ? (selectedName ? `Showing ${selectedName}` : 'Showing all skills') : ''}
      </div>
      <section className="sm-panel" aria-label="Skills">
        <div className="sm-head">
          <div className="sm-label">SKILL MAP</div>
          {selected && (
            <button type="button" className="sm-clear" onClick={() => choose(null)}>
              Show all skills
            </button>
          )}
        </div>
        <div className="sm-groups">
          {groups.map((g) => (
            <div className="sm-group" key={g.id}>
              <h2>{g.label}</h2>
              <div className="sm-chips">
                {g.skills.map((s) => {
                  const cls = `chip chip--${s.tier}`;
                  return interactive ? (
                    <button
                      type="button"
                      key={s.id}
                      ref={(el) => {
                        if (el) chipRefs.current.set(s.id, el);
                        else chipRefs.current.delete(s.id);
                      }}
                      className={cls}
                      aria-pressed={selected === s.id}
                      onClick={() => choose(selected === s.id ? null : s.id)}
                    >
                      {s.name}
                    </button>
                  ) : (
                    <a key={s.id} className={cls} href={`${PREFIX}${s.id}`}>
                      {s.name}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="sm-hint">Pick a skill to see the projects, work and roles where it was used.</p>
      </section>

      {skills.map((s) => {
        const items = evidence[s.id] ?? [];
        return (
          <section
            key={s.id}
            id={`skill-${s.id}`}
            className="skill-evidence sm-panel"
            hidden={selected !== null && selected !== s.id}
          >
            <div className="sm-evidence-head">
              <h2>{s.name}</h2>
              <span className="sm-tier">{TIER_WORDS[s.tier]}</span>
            </div>
            {items.length === 0 ? (
              <p className="sm-empty">No linked work yet.</p>
            ) : (
              <ul className="sm-list">
                {items.map((e) => (
                  <li key={`${e.kind}-${e.id}`}>
                    <span className="sm-kind">{KIND_WORDS[e.kind]}</span>
                    <a href={e.href}>{e.title}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
