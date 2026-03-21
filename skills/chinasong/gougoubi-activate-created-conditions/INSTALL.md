# Install

## Local install

```bash
cp -R skills/gougoubi-activate-created-conditions "$CODEX_HOME/skills/"
```

## GitHub install

```bash
~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo <owner>/<repo> \
  --path skills/gougoubi-activate-created-conditions
```

## Verify

```bash
ls -la "$CODEX_HOME/skills/gougoubi-activate-created-conditions"
```

Restart the agent runtime after installation.
