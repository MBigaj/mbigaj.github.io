---
title: Talis
order: 2
status: shipped
started: April 2024
ended: February 2025
summary: "Board game catalogue with per-player recommendations from a clustering model. Led the team of four that delivered it."
skills: [python, django, react, postgresql, pytest, agile-kanban, team-leadership, sprint-planning, git, github]
stack: ["Django", "React", "PostgreSQL", "clustering model", "DigitalOcean"]
repo: https://github.com/PKrystian/Talis
figures:
  - id: fig-talis-01
    caption: System overview and recommendation model
    nodes:
      - { id: browser, label: Browser, sub: React client, col: 0, row: 0 }
      - { id: app, label: Django app, sub: on DigitalOcean, col: 1, row: 0 }
      - { id: db, label: PostgreSQL, sub: DigitalOcean managed, col: 2, row: 0 }
      - { id: notebook, label: Jupyter notebook, sub: offline training, col: 0, row: 1 }
      - { id: model, label: Recommender, sub: pickled clustering, col: 1, row: 1 }
    edges:
      - { from: browser, to: app, label: REST API }
      - { from: app, to: db, label: queries }
      - { from: notebook, to: model, label: pickle, dashed: true }
      - { from: app, to: model, label: per-user picks }
screens:
  - src: ../../assets/talis/home.jpg
    alt: Talis home page listing the top-rated board games
    caption: "Home page: the highest-rated games, open to visitors without an account."
  - src: ../../assets/talis/library.jpg
    alt: A player's library of board games with ratings and dates added
    caption: "A player's library and wishlist, the data their recommendations are built from."
  - src: ../../assets/talis/event.jpg
    alt: A local game meeting with its games, host, crew size and a map
    caption: "Local game meetings: an event with its games, host, crew size and location."
  - src: ../../assets/talis/profile.jpg
    alt: A player's profile with their friends list
    caption: Profile and friends, with invites by user ID.
  - src: ../../assets/talis/sign-up.jpg
    alt: The Talis sign-up form
    caption: Sign-up form.
team:
  role: Team lead and full-stack developer, weighted to the backend
  members:
    - DevOps and full-stack engineer
    - Frontend engineer
    - Designer
  process: Seven sprints tracked on a Kanban board. Each was planned at about four weeks and several ran longer, alongside writing the thesis for the degree.
---

Talis helps players choose board games and organise their collection. A clustering model recommends games to each player from their own library and choices.
