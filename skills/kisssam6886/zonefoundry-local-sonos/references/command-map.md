# Command Map

Prefer JSON output and stable machine-readable commands.

## Preflight

```bash
zf update self --check --format json
zf setup --format json
zf doctor --format json
zf discover --format json
zf config get defaultRoom
zf service list --format json
zf config get defaultService
zf doctor service --service "QQ音乐" --query "郑秀文" --format json
zf auth smapi complete --service "QQ音乐" --wait 2m --format json
```

## Direct control

```bash
zf execute --data '{"action":"status","target":{"room":"客厅"}}'
zf execute --data '{"action":"pause","target":{"room":"客厅"}}'
zf execute --data '{"action":"next","target":{"room":"客厅"}}'
zf execute --data '{"action":"volume.set","target":{"room":"客厅"},"request":{"volume":20}}'
```

## Playback

```bash
zf play music "周杰伦" --format json
zf play music "<query>" --enqueue --format json
zf play music "<query>" --enqueue --limit <count> --format json
zf ncm lucky --name "客厅" "郑秀文" --format json
zf smapi search --name "客厅" --service "QQ音乐" --category tracks --open --index 1 --format json "周杰伦"
```

## Insert / announcement

```bash
zf announce "<text>" --name "<room>" --mode queue-insert --format json
```

## Recovery

```bash
zf queue heal --name "客厅" --timeout 15s --settle 2s --fallback-window 5 --format json
zf group rebuild --name "客厅" --via "浴室" --format json
```

## Recovery rules

- `queue heal` is the preferred single-room recovery attempt.
- `group rebuild` is a stronger helper-room recovery path.
- `--restore-reltime` is experimental and should not be the default path.
