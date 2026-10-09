import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const ym = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

// Text in a figure is drawn at a fixed size inside fixed boxes, so it is capped rather than wrapped.
const figure = z.object({
  id: z.string(),
  caption: z.string(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().max(20, 'A figure node label can be at most 20 characters'),
        sub: z.string().max(24, 'A figure node sub line can be at most 24 characters').optional(),
        col: z.number().int().min(0),
        row: z.number().int().min(0),
      }),
    )
    .min(1),
  edges: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().max(18, 'A figure edge label can be at most 18 characters').optional(),
        dashed: z.boolean().default(false),
      }),
    )
    .default([]),
});

const skills = defineCollection({
  loader: file('src/data/skills.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    area: z.enum(['languages', 'data', 'infrastructure', 'observability', 'delivery']),
    tier: z.enum(['daily', 'solid', 'familiar']),
  }),
});

const roles = defineCollection({
  loader: file('src/data/roles.json'),
  schema: z.object({
    id: z.string(),
    kind: z.enum(['role', 'education']),
    employer: z.string(),
    title: z.string(),
    start: ym,
    end: ym.nullable(),
    skills: z.array(reference('skills')),
    summary: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      order: z.number().int(),
      status: z.enum(['in-progress', 'shipped']),
      skills: z.array(reference('skills')).min(1),
      stack: z.array(z.string()).min(1),
      repo: z.string().url(),
      started: z.string().optional(),
      ended: z.string().optional(),
      figures: z.array(figure).default([]),
      scaling: z
        .object({ growth: z.string(), bottleneck: z.string(), tenX: z.string() })
        .optional(),
      team: z
        .object({ role: z.string(), members: z.array(z.string()).min(1), process: z.string() })
        .optional(),
      screens: z
        .array(z.object({ src: image(), alt: z.string(), caption: z.string() }))
        .default([]),
      roadmap: z
        .object({
          done: z.array(z.string()),
          inProgress: z.array(z.string()),
          planned: z.array(z.string()),
        })
        .optional(),
    }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    code: z.string(),
    employer: z.string(),
    period: z.string().optional(),
    order: z.number().int(),
    summary: z.string(),
    tags: z.array(z.string()),
    skills: z.array(reference('skills')).min(1),
    figures: z.array(figure).default([]),
  }),
});

export const collections = { skills, roles, projects, work };
