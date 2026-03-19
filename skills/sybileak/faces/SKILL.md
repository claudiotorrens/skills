---
name: faces
description: >
  Use this skill when the user wants to create, compile, or chat through a Face
  (a persona compiled from source material), compose personas with boolean
  formulas, compare minds by semantic similarity, import YouTube videos into a
  Face, or manage their Faces Platform account (API keys, billing, quotas).
  Also use when the user mentions the Faces Platform, the `faces` CLI, or asks
  about persona compilation, cognitive primitives, or mind arithmetic — even if
  they don't use those exact terms.
license: MIT
compatibility: Requires the faces CLI (npm install -g faces-cli) and internet access to api.faces.sh.
metadata: {"author": "headwaters-ai", "version": "1.0", "openclaw": {"requires": {"bins": ["faces"]}, "primaryEnv": "FACES_API_KEY", "install": [{"type": "node", "package": "faces-cli", "global": true}]}}
---

# Faces Skill

You have access to the `faces` CLI. Use it to fulfill any Faces Platform request.

Always use `--json` when you need to extract values from command output.

## Current config
!`faces config:show 2>/dev/null || echo "(no config saved)"`

## Setup

Verify credentials: `faces auth:whoami`. If no credentials exist, see [references/AUTH.md](references/AUTH.md) for registration (requires human payment step) and login.

Install (if `faces` command not found): `npm install -g faces-cli`

`faces auth:*` and `faces keys:*` require JWT. Everything else accepts JWT or API key.

## Plans

Two plans: **Free** ($5 minimum initial spend, pay-per-token with 5% markup on all usage including compilation) and **Connect** ($17/month, 100k compile tokens/month, free passthrough to OpenAI Codex for users with a ChatGPT subscription). See [references/AUTH.md](references/AUTH.md) for details.

## Core workflow

1. Create a Face: `faces face:create --name "Name" --username slug`
2. Compile source material into it — local files or YouTube URLs
3. Sync to extract and embed cognitive primitives
4. Chat through the Face: `faces chat:chat slug -m "message"`
5. Compare Faces: `faces face:diff` or `faces face:neighbors`
6. Compose new Faces from boolean formulas: `faces face:create --formula "a | b"`

Boolean operators: `|` (union), `&` (intersection), `-` (difference), `^` (symmetric difference). Parentheses supported: `(a | b) - c`.

## Common tasks

### Compile a document into a face
```bash
DOC_ID=$(faces compile:doc:create <face_id> --label "Notes" --file notes.txt --json | jq -r '.id')
faces compile:doc:prepare "$DOC_ID"
faces compile:doc:sync "$DOC_ID" --yes
```

### Upload a file (PDF, audio, video, text)
```bash
faces face:upload <face_id> --file report.pdf --kind document
faces face:upload <face_id> --file interview.mp4 --kind thread
```

### Import a YouTube video
```bash
# Solo talk / monologue → document
faces compile:import <face_id> \
  --url "https://www.youtube.com/watch?v=VIDEO_ID" \
  --type document --perspective first-person

# Then prepare and sync:
faces compile:doc:prepare <doc_id>
faces compile:doc:sync <doc_id> --yes

# Multi-speaker → thread (no prepare step needed)
faces compile:import <face_id> \
  --url "https://youtu.be/VIDEO_ID" \
  --type thread --perspective first-person --face-speaker A
faces compile:thread:sync <thread_id>
```

If `--type thread` fails with a 422, retry with `--type document`.

### Create a composite face
```bash
faces face:create --name "The Realist" --username the-realist \
  --formula "the-optimist | the-pessimist"

# Chat through it like any other face
faces chat:chat the-realist -m "How do you approach risk?"
```

Composite faces are live: sync new knowledge into any component and the composite updates automatically. Components must be concrete (compiled) faces you own.

### Compare faces
```bash
faces face:diff --face aria --face marco --face jin
faces face:neighbors aria --k 3
faces face:neighbors aria --component beta --direction furthest --k 5
```

### Chat with a specific LLM
```bash
faces chat:chat slug --llm claude-sonnet-4-6 -m "message"
faces chat:messages slug@claude-sonnet-4-6 -m "message" --max-tokens 512
faces chat:responses slug@gpt-4o -m "message"
```

### Face templates

Use `${face-username}` in any message to reference another face's profile inline. The token is replaced with the face's display name and the profile is injected as context. A bare model name (no face prefix) skips the persona and lets you reference all faces via templates.

```bash
faces chat:chat alice --llm gpt-4o-mini -m 'You are debating ${bob}. Argue your position.'
faces chat:messages gpt-4o-mini -m 'Compare the worldviews of ${alice} and ${bob}.'
```

See [references/TEMPLATES.md](references/TEMPLATES.md) for full details and rules.

### Billing and API keys
```bash
faces billing:balance --json
faces billing:subscription --json
faces keys:create --name "Partner key" --face slug --budget 10.00 --expires-days 30
```

## Common errors

- **`faces: command not found`** — Run `npm install -g faces-cli`.
- **`401 Unauthorized`** — Credentials missing or expired. Run `faces auth:login` or check `FACES_API_KEY`.
- **`compile:doc:prepare` returns "processing"** — Extraction is async. Poll with `faces compile:doc:get <doc_id> --json | jq '.status'` until status is `ready`, then sync.
- **`422` on thread import** — No speaker segments detected. Retry with `--type document`.
- **`face:diff` or `face:neighbors` returns null components** — The face hasn't been synced yet. Run the compile+sync workflow first.

## References

- See [references/QUICKSTART.md](references/QUICKSTART.md) for the end-to-end guide: install → register → create → compile → chat.
- See [references/REFERENCE.md](references/REFERENCE.md) for the full command reference, global flags, and environment variables.
- See [references/AUTH.md](references/AUTH.md) for registration, login, API keys, and credential management.
- See [references/CONCEPTS.md](references/CONCEPTS.md) for a detailed explanation of what Faces is, how it works, and example use cases.
- See [references/OAUTH.md](references/OAUTH.md) for connecting a ChatGPT account (connect plan only).
- See [references/TEMPLATES.md](references/TEMPLATES.md) for face template syntax (`${face-username}`) and bare model usage.
- See [references/SCOPE.md](references/SCOPE.md) for instruction scope and security boundaries.
