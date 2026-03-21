---
name: calculus
version: "2.0.0"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
license: MIT-0
tags: [calculus, tool, utility]
description: "Compute derivatives, integrals, limits, and series step by step. Use when solving calculus problems, plotting functions, or verifying integrals."
---

# Calculus

Utility toolkit — run, check, convert, analyze, generate, preview, batch, compare, and manage data entries. Each command logs input with timestamps for full traceability and historical review.

## Commands

| Command | Description |
|---------|-------------|
| `calculus run <input>` | Log a run entry (no args = view recent runs) |
| `calculus check <input>` | Log a check entry (no args = view recent checks) |
| `calculus convert <input>` | Log a convert entry (no args = view recent converts) |
| `calculus analyze <input>` | Log an analyze entry (no args = view recent analyses) |
| `calculus generate <input>` | Log a generate entry (no args = view recent generates) |
| `calculus preview <input>` | Log a preview entry (no args = view recent previews) |
| `calculus batch <input>` | Log a batch entry (no args = view recent batches) |
| `calculus compare <input>` | Log a compare entry (no args = view recent compares) |
| `calculus export <input>` | Log an export entry (no args = view recent exports) |
| `calculus config <input>` | Log a config entry (no args = view recent configs) |
| `calculus status <input>` | Log a status entry (no args = view recent statuses) |
| `calculus report <input>` | Log a report entry (no args = view recent reports) |
| `calculus stats` | Summary statistics — entry counts per category, total, data size, first entry date |
| `calculus search <term>` | Search across all log entries |
| `calculus recent` | Show last 20 history entries |
| `calculus help` | Show usage info |
| `calculus version` | Show version string |

> **Note:** The script also defines `_export <fmt>` (json/csv/txt) and `_status` helper functions for structured data export and health checks, though the primary case dispatch routes `export` and `status` to the logging variants.

## Data Storage

All data is stored locally in `~/.local/share/calculus/`. Each command writes to its own `.log` file (e.g., `run.log`, `check.log`, `analyze.log`). A unified `history.log` records every action with timestamps. No external services or databases required.

**Log format:** `YYYY-MM-DD HH:MM|<value>`

**Export formats:** JSON, CSV, or plain text (via the `_export` helper function).

## Requirements

- **bash** (version 4+ recommended)
- Standard POSIX utilities: `date`, `wc`, `du`, `grep`, `tail`, `head`, `cat`
- No external dependencies, no network access needed
- Works on Linux, macOS, and WSL

## When to Use

1. **Logging computation results** — Record mathematical operations, verification steps, or calculation outputs with `run` or `analyze` for future reference
2. **Tracking unit conversions** — Use `convert` to log unit or format conversion results with timestamps
3. **Batch processing records** — Log batch operation details with `batch` and compare different approaches with `compare`
4. **Configuration and status auditing** — Record configuration changes with `config` and system states with `status` for a full audit trail
5. **Generating reports and exporting data** — Create `report` entries for summaries, use `stats` to view aggregates, and `search` to find specific entries across all logs

## Examples

```bash
# Log a calculation run
calculus run "integral of x^2 dx = x^3/3 + C"

# Log a conversion
calculus convert "radians to degrees: pi/4 = 45°"

# Analyze a dataset
calculus analyze "Series convergence: sum 1/n^2 converges to pi^2/6"

# Generate output
calculus generate "Taylor expansion of e^x: 1 + x + x^2/2 + x^3/6 + ..."

# Compare two methods
calculus compare "Trapezoidal vs Simpson: error 0.02 vs 0.001"

# Log a report
calculus report "Weekly computation log: 38 entries, all verified"

# Search across all entries
calculus search "convergence"

# View summary statistics
calculus stats

# View recent activity
calculus recent

# Check configuration history
calculus config
```

## How It Works

Calculus stores all data locally in `~/.local/share/calculus/`. Each command logs activity with timestamps for full traceability. Use `stats` to see a summary of entries per category with total counts, data size, and the date of your first entry. Use `search` to find specific entries across all logs, `recent` to view the latest activity, or the built-in export helper to back up your data in JSON, CSV, or plain text format.

---

Powered by BytesAgain | bytesagain.com | hello@bytesagain.com
