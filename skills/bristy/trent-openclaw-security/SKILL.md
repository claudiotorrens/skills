---
name: trent-openclaw-security
description: Audit your OpenClaw deployment for security risks using Trent AppSec Advisor
version: 3.3.3
homepage: https://trent.ai
user-invocable: true
metadata:
  openclaw:
    requires:
      bins:
        - trent-openclaw-audit
        - trent-openclaw-sysinfo
        - trent-openclaw-package-skills
        - trent-openclaw-upload-skills
        - trent-openclaw-analyse-skills
---

# Trent OpenClaw Security Audit

Audit your OpenClaw deployment for security risks. Identifies misconfigurations,
chained attack paths, and provides severity-rated findings with fixes.

## Setup

If `trent-openclaw-audit` is not found, tell the user to run the installer:
> Install with: `curl -fsSL https://raw.githubusercontent.com/trnt-ai/openclaw-security/main/install.sh | bash`

## Instructions

This audit runs in three phases. By default, `trent-openclaw-audit` runs all
three phases. Use `--config-only` to run just Phase 1, or the individual
CLI tools for more control.

### Default: Full Audit (all 3 phases)

```bash
trent-openclaw-audit
```

This runs configuration audit, skill upload, and deep skill analysis in a
single command with automatic conversation continuity.

### Step-by-step: Individual Phases

#### Phase 1 — Configuration Audit (only)

Run the audit CLI with `--config-only` to analyse just the configuration:

```bash
trent-openclaw-audit --config-only
```

Optional: specify a custom config path:

```bash
trent-openclaw-audit --path /path/to/openclaw/config
```

The command outputs findings to stdout. Parse the output and present it to
the user. The last line contains `[TRENT_THREAD_ID:<id>]` — save this thread
ID for Phase 3.

Present findings grouped by severity (see "Present results" below).

Summarize: "Phase 1 complete. N findings from configuration analysis. Proceeding to upload skills for deeper analysis..."

#### Phase 2 — Skill Upload

**Data Disclosure — present this to the user before proceeding:**

> This phase will send the following data to Trent for security analysis:
> - **Skill source code** for each installed skill
> - **Skill metadata** (name, version, dependencies)
> - **Skill configuration parameters**
>
> No credentials, environment variables, or non-skill workspace files are included.

**Wait for the user to confirm before running the upload command.**

Run the upload CLI to package and upload installed skills:

```bash
trent-openclaw-upload-skills > /tmp/upload_summary.json
```

This scans the workspace, packages each skill as a `.skill` ZIP archive,
uploads to Trent via S3, and outputs a JSON summary to stdout.

Present the upload summary:
- How many skills were uploaded, skipped (unchanged), failed, or too large
- List each skill by name and status

If all uploads failed, report the errors and stop. Otherwise proceed.

Summarize: "Phase 2 complete. N skills uploaded. Proceeding to deep skill analysis..."

#### Phase 3 — Deep Skill Analysis

Run the analysis CLI, passing the thread ID from Phase 1 and the upload
summary from Phase 2:

```bash
trent-openclaw-analyse-skills --thread-id <THREAD_ID> --upload-summary /tmp/upload_summary.json
```

Or pipe from Phase 2 directly:

```bash
trent-openclaw-upload-skills | trent-openclaw-analyse-skills --thread-id <THREAD_ID> --upload-summary -
```

This launches one analysis request per skill **in parallel**, so results start
appearing as soon as each skill is analysed — output order may differ from
upload order. Each request uses the Phase 1 thread ID so the advisor has full
context from the configuration audit.

Present the deep analysis results alongside the Phase 1 findings.

### Inspect system context separately

To view the system analysis data without running a full audit:

```bash
trent-openclaw-sysinfo
```

This outputs JSON with OS details, hardware type, user mode, channel status,
and installed skills. Useful for debugging or verifying what data is sent.

### Present results

Format findings grouped by severity:
- **CRITICAL**: Immediate action required
- **HIGH**: Fix soon
- **MEDIUM**: Recommended improvement
- **LOW**: Minor hardening

For each finding show: the risk, where it was found, and the exact fix.

Highlight **chained attack paths** — where multiple settings combine to create worse outcomes.

Present recommended config changes as a diff snippet for the user to review
and apply manually. Do **not** modify any system files directly.

## When to use

- User asks "Is my setup secure?" or "audit my config"
- After changes to OpenClaw configuration, new plugins, or new MCP servers
