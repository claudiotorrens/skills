---
name: dr-memory-foundation
description: "Opinionated, file-based memory layout for OpenClaw-style agents: dashboards (now/open-loops/automation), topic files, glossary, and an always-on policy+topic catalog. Use when setting up or reorganizing agent memory, creating a memory folder structure, adding always_on.md, building a topic catalog, or preparing memory files so retrieval+compression pipelines work well." 
---

# Memory Structure Template (dashboards + topics)

Use this skill to set up a memory layout that is easy to retrieve from, audit, and compress.

## Template layout
- `MEMORY.md` (small): preferences + indexes only.
- `memory/always_on.md`: tiny policy header + topic catalog (with keywords).
- Dashboards / registries:
  - `memory/now.md`
  - `memory/open-loops.md`
  - `memory/automation.md`
- Topics:
  - `memory/topics/glossary.md`
  - `memory/topics/<topic>.md`
- Daily logs:
  - `memory/YYYY-MM-DD.md`

## Apply (safe steps)
1) Create the folders/files from `references/templates/`.
2) Move existing knowledge into topic files without deleting source logs.
3) Keep `MEMORY.md` as indexes + preferences only.
4) Update the topic catalog in `memory/always_on.md` as topics evolve.

## Templates
Use the files under `references/templates/`.
