---
name: watch
version: "1.0.0"
description: "Monitor file and directory changes using CLI watchers. Use when you need to watch for file modifications, track change history, filter events,"
author: BytesAgain
homepage: https://bytesagain.com
source: https://github.com/bytesagain/ai-skills
tags:
  - file-watcher
  - monitoring
  - filesystem
  - changes
  - devops
---

# Watch — File/Directory Change Monitoring Tool

A thorough CLI tool for monitoring file and directory changes. Supports watch session management, change logging, event filtering, ignore patterns, real-time status, change history, and export — all stored locally in JSONL format for analysis and auditing.

## Prerequisites

- Python 3.8+
- Bash shell
- `inotifywait` (from `inotify-tools`) for real-time watching on Linux, or polling fallback

## Data Storage

All watch sessions, events, and configuration are persisted in `~/.watch/data.jsonl`. Each line is a JSON object representing either a watch session definition or a file change event with timestamp, path, event type, and metadata.

## Commands

Run all commands via the script at `scripts/script.sh`.

### `start`
Start watching a directory or file for changes.
```bash
bash scripts/script.sh start <watch_name> --path <directory_or_file> [--recursive] [--events modify,create,delete,move] [--interval 5]
```

### `stop`
Stop an active watch session.
```bash
bash scripts/script.sh stop <watch_name>
```

### `list`
List all watch sessions (active and inactive).
```bash
bash scripts/script.sh list [--active] [--format table|json]
```

### `log`
Add a manual log entry or show recent change events for a watch.
```bash
bash scripts/script.sh log <watch_name> [--message "manual note"] [--count 20]
bash scripts/script.sh log <watch_name> --show [--count 50]
```

### `filter`
Filter change events by type, path pattern, or time range.
```bash
bash scripts/script.sh filter <watch_name> [--event modify|create|delete] [--path-pattern "*.js"] [--from timestamp] [--to timestamp] [--limit 100]
```

### `ignore`
Add or remove ignore patterns for a watch session.
```bash
bash scripts/script.sh ignore <watch_name> --add "*.log,node_modules,.git"
bash scripts/script.sh ignore <watch_name> --remove "*.log"
bash scripts/script.sh ignore <watch_name> --list
```

### `config`
Configure watch settings (polling interval, max events, retention).
```bash
bash scripts/script.sh config set <key> <value>
bash scripts/script.sh config get <key>
bash scripts/script.sh config list
```

### `status`
Show the current status of a watch session or all sessions.
```bash
bash scripts/script.sh status [watch_name] [--all]
```

### `export`
Export change events to JSON, CSV, or text format.
```bash
bash scripts/script.sh export <watch_name> [--format json|csv|text] [--output changes.json] [--from timestamp] [--to timestamp]
```

### `history`
Show the full change history for a watched path with timeline visualization.
```bash
bash scripts/script.sh history <watch_name> [--days 7] [--group-by hour|day] [--stats]
```

### `help`
Show usage information and available commands.
```bash
bash scripts/script.sh help
```

### `version`
Show the current version of the watch tool.
```bash
bash scripts/script.sh version
```

## Workflow Example

```bash
# Start watching a project directory
bash scripts/script.sh start myproject --path ./src --recursive --events modify,create,delete

# Add ignore patterns
bash scripts/script.sh ignore myproject --add "*.pyc,__pycache__,.git,node_modules"

# Check status
bash scripts/script.sh status myproject

# View recent changes
bash scripts/script.sh log myproject --show --count 10

# Filter for specific events
bash scripts/script.sh filter myproject --event modify --path-pattern "*.py"

# View history with stats
bash scripts/script.sh history myproject --days 7 --stats

# Export changes
bash scripts/script.sh export myproject --format json --output changes.json

# Stop watching
bash scripts/script.sh stop myproject
```

## Event Types

- **modify**: File content changed
- **create**: New file or directory created
- **delete**: File or directory deleted
- **move**: File or directory renamed/moved
- **attrib**: File attributes changed (permissions, ownership)

## Notes

- Uses inotify on Linux for efficient real-time monitoring when available.
- Falls back to polling mode when inotify is unavailable.
- Ignore patterns follow gitignore-style glob syntax.
- History grouping provides insights into change patterns over time.
- All events are persisted for post-hoc analysis and auditing.

---

Powered by BytesAgain | bytesagain.com | hello@bytesagain.com
