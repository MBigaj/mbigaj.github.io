export const SITE = {
  name: 'Mikołaj Bigaj',
  role: 'Backend engineer',
  tagline: 'Backend engineer · Python · Poland',
  pitch:
    'I build Python services and the infrastructure they run on: APIs, data stores, CI/CD pipelines and Kubernetes deployments.',
  email: 'mikolaj.bigaj.00@gmail.com',
  github: 'https://github.com/MBigaj',
  linkedin: 'https://www.linkedin.com/in/mikolajbigaj/',
  cv: '/Mikolaj_Bigaj_CV.pdf',
  timelineNote: 'Oct 2024 to Mar 2025: full-time on the engineering degree and Talis.',
} as const;

export const AREAS = [
  { id: 'languages', label: 'Languages and frameworks' },
  { id: 'data', label: 'Data and messaging' },
  { id: 'infrastructure', label: 'Infrastructure and delivery' },
  { id: 'observability', label: 'Observability and testing' },
  { id: 'delivery', label: 'Delivery and leadership' },
] as const;

/** The one list of skill areas: the content schema takes its allowed ids from here. */
export const AREA_IDS = AREAS.map((a) => a.id);

export const TIERS = ['daily', 'solid', 'familiar'] as const;
