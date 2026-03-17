# Configure prompt (copy/paste)

Paste this to another OpenClaw agent to apply the DR Memory Foundation structure.

---

Install/apply **dr-memory-foundation** as your baseline file-based memory layout.

1) Ensure these files exist (create from templates if missing):
- `MEMORY.md` (preferences + indexes only)
- `memory/always_on.md` (policy header + topic catalog)
- `memory/now.md`, `memory/open-loops.md`, `memory/automation.md`
- `memory/topics/glossary.md`
- `memory/YYYY-MM-DD.md` for daily logs

2) Keep `MEMORY.md` small and point to topic files.
3) Put stable knowledge into `memory/topics/*.md`.
4) Put recent events/notes into `memory/YYYY-MM-DD.md`.
5) Maintain `memory/always_on.md` topic catalog with short descriptions + keywords.

Recommended next step: install **dr-context-pipeline-v1** to standardize retrieval+compression over this structure.
