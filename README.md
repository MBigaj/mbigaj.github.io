# Mikołaj Bigaj, portfolio

A static portfolio site for Mikołaj Bigaj, a backend engineer. It lists projects, work and roles, and shows which skills each of them used. Live at https://mbigaj.github.io.

## How it is built

```mermaid
flowchart LR
  P[Projects] --> V[Schema check]
  W[Work] --> V
  R[Roles] --> V
  S[Skills] --> V
  V --> B[Astro build]
  B --> G[GitHub Pages]
```

The site is an Astro 7 project in TypeScript. Content lives in four collections: projects and work are Markdown files with frontmatter, roles and skills are JSON files. A zod schema in `src/content.config.ts` checks the shape of every entry, so a missing field or a malformed figure fails the build. The evidence shown for each skill is derived: a skill's page lists the projects, work and roles that reference it, so nothing is tallied by hand. The code that builds those lists (`src/lib/evidence.ts`) checks every reference, so a misspelled skill id also fails the build, naming the id and the entry that used it. Architecture diagrams are data (nodes on a grid and edges), laid out by `src/lib/figure.ts` and drawn as SVG at build time. The only React island is the interactive skill map on the skills page; everything else is static HTML.

## Project layout

```
src/
  content/projects/   one Markdown file per project
  content/work/       one Markdown file per work item
  data/               roles.json and skills.json
  components/         Astro and React components
  layouts/            shared page layout
  lib/                pure logic: figure layout, timeline, skill evidence
  pages/              routes, including the 404 page
  styles/             design tokens and global styles
tests/unit/           Vitest tests for the logic in src/lib and the data files
tests/e2e/            Playwright tests against the built site
.github/workflows/    CI and deploy
```

## Adding a project

Add one Markdown file to `src/content/projects/`. The frontmatter fields are:

- `title`, `summary`, `order` (position in the list) and `status` (`in-progress` or `shipped`)
- `skills`: ids from `src/data/skills.json`, at least one. The skills page lists the project as evidence under each of them; the project's own stack line does not print them
- `stack`: the stack line printed on the home page and the project page, as a list of free-text labels, at least one
- `repo`: repository URL
- `started`, `ended`: free-text dates (optional)
- `figures`, `scaling`, `team`, `screens`, `roadmap`: optional sections, described below. A case-study section with no content is left out of the production build; `npm run dev` shows a "Content pending" box in its place

The optional sections have these shapes:

```yaml
scaling:
  growth: How the system grows.              # text
  bottleneck: What gives out first.          # text
  tenX: What changes at ten times the load.  # text
team:
  role: Your role on the team.               # text
  members:                                   # the other people, at least one
    - Frontend engineer
  process: How the work was run.             # text
screens:                                     # a list; each entry needs all three fields
  - src: ./screens/encounter.png             # image path, relative to the Markdown file
    alt: What the screenshot shows.
    caption: Line printed under the image.
roadmap:                                     # all three lists are required and may be empty
  done: [First thing shipped]
  inProgress: [Thing being built]
  planned: []
```

The page heads the member list "Team of N", counting you with the members. A roadmap whose three lists are all empty counts as no content.

Example, abridged from `src/content/projects/talis.md` (the file also has a `team` block):

```yaml
---
title: Talis
order: 2
status: shipped
started: April 2024
ended: February 2025
summary: "Board game catalogue with per-player recommendations from a clustering model. Led the team of four that delivered it."
skills: [python, django, react, postgresql, pytest, agile-kanban, team-leadership, sprint-planning, git, github]
stack: ["Django", "React", "PostgreSQL", "clustering model"]
repo: https://github.com/PKrystian/Talis
---
```

The Markdown body below the frontmatter is the project description.

### Describing a figure

A figure is a list of nodes and edges. Each node has an `id`, a `label`, an optional `sub` line, and a `col` and `row` that place it on a grid. Each edge names a `from` and `to` node, with an optional `label` and `dashed: true` for a dashed line.

The layout is deliberately simple, and the build refuses a figure it would draw wrongly:

- One node per grid cell, and every node id is unique within its figure.
- An edge runs straight between two nodes in the same row or column. Otherwise it bends once: it leaves the side of the `from` node, runs along that node's row, then turns into the top or bottom of the `to` node.
- An edge may not start and end at the same node, pass through any other node, or run along the same stretch as another edge. That rules out two edges between the same pair of nodes, one in each direction. Edges may cross.
- Text is not wrapped: a node `label` is at most 20 characters, a node `sub` at most 24 and an edge `label` at most 18.

When a figure is refused, the error names the figure and the nodes involved; move a node to another cell or drop an edge. From `src/content/projects/dark-souls-app.md`:

```yaml
figures:
  - id: fig-01
    caption: Request path and telemetry
    nodes:
      - { id: browser, label: Browser, sub: React client, col: 0, row: 0 }
      - { id: api, label: API, sub: FastAPI service, col: 1, row: 0 }
      - { id: db, label: Database, sub: MongoDB, col: 2, row: 0 }
      - { id: obs, label: Observability, sub: New Relic, col: 1, row: 1 }
    edges:
      - { from: browser, to: api, label: "HTTPS, JSON" }
      - { from: api, to: db, label: queries }
      - { from: api, to: obs, label: "traces, metrics", dashed: true }
```

## Running it

Node 22.12 or newer is needed.

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests (Vitest)
npm run e2e     # end-to-end tests (Playwright)
npm run check   # type and content check (astro check)
```

`npm run e2e` builds the site and starts its own preview server on port 4331, so it can run while `npm run dev` holds port 4321. It needs a Chromium browser, installed once with `npx playwright install chromium`.

## Deployment

Pull requests run the checks and tests in `.github/workflows/ci.yml`. A merge to `main` builds the site and deploys it to GitHub Pages through `.github/workflows/deploy.yml`. The workflow also runs on the first of each month, so the open-ended bar on the timeline stays current. In the repository, Settings, Pages, Source must be set to "GitHub Actions".
