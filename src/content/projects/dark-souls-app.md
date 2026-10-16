---
title: "Dark Souls: The Board Game app"
order: 1
status: in-progress
summary: "Companion web app, built as a full production-style system."
skills: [python, fastapi, react, mongodb, docker, new-relic, git, github]
stack: ["FastAPI", "React", "MongoDB", "New Relic"]
repo: https://github.com/MBigaj/DarkSoulsTheBoardGameApp
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
---

All the information about the game's cards, tiles and encounters in one place. Players can build custom encounters, randomise them and check their own character builds.
