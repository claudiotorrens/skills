# Gmail Hook Setup — Autonomous Tracebit Alert Response

This is **Step 6** of the Tracebit setup in SKILL.md. Complete Steps 1–5 first.

**You (the agent) execute every step below yourself.** Do not ask the human to run commands, edit files, or configure anything — except where explicitly marked as a human prerequisite.

When configured, the full autonomous pipeline works:
```
Canary fires → Tracebit alert email → Gmail Pub/Sub → gog watch daemon
  → OpenClaw /hooks/gmail → mapping matches → agent session spawns
    → immediate human notification → investigation → structured report → canary rotation
```

---

## Architecture

```
Gmail inbox
  └── Gmail Watch (gog) pushes new mail events to Pub/Sub
        └── Google Pub/Sub topic (gog-gmail-watch)
              └── push subscription → Tailscale Funnel (public HTTPS)
                    └── gog gmail watch serve (local daemon, port 8788)
                          └── POST → OpenClaw /hooks/gmail
                                └── mapping matches → spawns agent session
```

The wizard (`openclaw webhooks gmail setup`) handles GCP topic creation, Gmail watch, Tailscale Funnel wiring, and OpenClaw config automatically. The gateway then auto-manages the `gog gmail watch serve` daemon.

---

## Prerequisites

All three must be true before running the wizard. Verify first:

```bash
gog auth list        # must show YOUR@gmail.com
gcloud auth list     # must show YOUR@gmail.com as active account (marked with *)
tailscale status     # must show device connected to tailnet
```

**If any fail:** stop and ask the human to fix it. gcloud auth and Tailscale setup require human intervention (CAPTCHAs, device registration) and cannot be done autonomously.

### Set the GCP project (you do this)

The Pub/Sub topic must live in the same GCP project as the `gog` OAuth client. Find the project and set it before running the wizard:

```bash
# Find the project ID from the gogcli client secret:
cat ~/.config/gogcli/client_secret_*.json 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d.values())[0].get('project_id',''))"

# Set it as the active project:
gcloud config set project YOUR_PROJECT_ID

# Confirm:
gcloud config get project
```

### Enable required GCP APIs (you do this)

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

---

## Step 1 — Run the Setup Wizard

```bash
openclaw webhooks gmail setup --account YOUR@gmail.com
```

This single command:
1. Creates the GCP Pub/Sub topic `gog-gmail-watch`
2. Grants Gmail API push permissions on the topic
3. Starts the Gmail watch pointing to the topic
4. Configures Tailscale Funnel as the public HTTPS push endpoint
5. Enables the `gmail` hook preset in OpenClaw config
6. Writes `hooks.gmail` config so the gateway auto-starts the watcher on boot

**If Funnel is not enabled on the tailnet**, the wizard will print a URL like:
```
Funnel is not enabled on your tailnet.
To enable, visit: https://login.tailscale.com/f/funnel?node=XXXX
```
Navigate to that URL in the browser tool, click **Enable Funnel**, then re-run the wizard.

**Verify after the wizard:**
```bash
gog gmail watch status --account YOUR@gmail.com
# Should show: account, topic, labels, history_id, expiration

tailscale funnel status
# Should show: /gmail-pubsub → proxy http://127.0.0.1:8788
```

---

## Step 2 — Start the Watch Daemon

After the wizard, start the push handler daemon:

```bash
openclaw webhooks gmail run
```

This runs `gog gmail watch serve` and keeps it alive. The gateway also auto-starts this on boot when `hooks.enabled=true` and `hooks.gmail.account` is set — so you only need to run it manually the first time or after a restart.

Verify the daemon is listening:
```bash
ss -tlnp | grep 8788
# Should show: gog process listening on 127.0.0.1:8788
```

---

## Step 3 — Add the Tracebit Alert Mapping

The wizard enables the generic `gmail` preset (triggers on every incoming email). Add a Tracebit-specific mapping that instructs the spawned agent to filter for canary alerts and run incident response.

Use `gateway config.patch` to add the mapping (do NOT edit the JSON file directly — `config.patch` triggers a hot reload):

```python
# Via the gateway tool:
gateway(action="config.patch", raw=JSON_BELOW, note="Tracebit canary alert mapping added")
```

```json
{
  "hooks": {
    "mappings": [
      {
        "match": {
          "path": "gmail"
        },
        "action": "agent",
        "wakeMode": "now",
        "name": "Tracebit Alert",
        "sessionKey": "hook:tracebit-alert:{{messages[0].id}}",
        "messageTemplate": "You received an email. Check if it is a Tracebit canary alert:\n\nFrom: {{messages[0].from}}\nSubject: {{messages[0].subject}}\nDate: {{messages[0].date}}\n\n{{messages[0].body}}\n\n---\nINSTRUCTIONS:\n1. If this email is NOT from notifications@community.tracebit.com with subject 'Tracebit Canary Triggered': reply 'Not a Tracebit alert, ignoring.' and stop.\n2. If it IS a Tracebit canary alert: you are an autonomous incident responder. Immediately follow the incident response playbook in your tracebit-canaries skill. Notify the human first (within 30 seconds), then investigate, then report.",
        "model": "sonnet",
        "deliver": true,
        "channel": "last"
      }
    ]
  }
}
```

**Key fields:**

| Field | Value | Purpose |
|-------|-------|---------|
| `match.path` | `"gmail"` | Matches all Gmail webhook events |
| `action` | `"agent"` | Spawn an isolated agent session |
| `wakeMode` | `"now"` | Spawn immediately, don't defer |
| `sessionKey` | per-email template | Prevents duplicate sessions for the same alert |
| `messageTemplate` | email content + filter instruction + playbook instruction | Agent first checks sender/subject, then acts only if it's a real canary alert |
| `deliver` | `true` | Gateway delivers the agent's response to the last active channel |
| `channel` | `"last"` | Delivers to the most recently active messaging channel |
| `model` | `"sonnet"` | Use Claude Sonnet for the investigation session |

> **Why the agent filters, not the mapping:** The `match` config supports `path` and `source` only — `from` and `subject` fields are silently dropped. The agent itself checks the sender (`notifications@community.tracebit.com`) and subject (`Tracebit Canary Triggered`) and ignores non-Tracebit emails.

**To always notify via a specific channel** (e.g. Telegram), replace `"channel": "last"` with `"channel": "telegram"` and add `"to": "+15551234567"`.

No gateway restart needed — `config.patch` triggers a hot reload.

---

## Step 4 — Verify the Integration

```bash
# Daemon is running
ss -tlnp | grep 8788

# Funnel is active
tailscale funnel status

# Gmail watch is active
gog gmail watch status --account YOUR@gmail.com

# Gateway loaded the mapping (check logs)
grep -i "hook\|mapping\|reload" /tmp/openclaw-0/openclaw-$(date +%Y-%m-%d).log | tail -10
```

---

## Step 5 — Test the Full Pipeline

**Wait at least 2 minutes after the wizard completes** before triggering. The wizard resets the Gmail watch historyId — pushes arriving within ~60s of the reset may be marked stale and skipped. This is normal, not a bug.

```bash
# SSH trigger is fastest (~1–3 min). Always pass --name:
tracebit trigger ssh --name "YOUR_CANARY_NAME"
```

Wait, then check Gmail:
```bash
sleep 120
gog gmail search 'from:notifications@community.tracebit.com subject:"Tracebit Canary Triggered" newer_than:10m' \
  --account YOUR@gmail.com --max 5
```

Watch gateway logs for the push and agent spawn:
```bash
grep -i "historyId\|forward\|hook\|agent\|spawn" /tmp/openclaw-0/openclaw-$(date +%Y-%m-%d).log | tail -20
```

**Expected end-to-end timing:**
```
[0s]     tracebit trigger ssh --name NAME
[~90s]   Tracebit detects SSH connection → sends alert email
[~95s]   Gmail receives the alert email
[~96s]   Gmail Pub/Sub pushes event to Tailscale Funnel endpoint
[~97s]   gog watch daemon processes push → POSTs to OpenClaw /hooks/gmail
[~98s]   OpenClaw matches mapping → spawns isolated agent session
[~30s]   Agent checks sender/subject → confirms Tracebit alert → notifies human
[~5min]  Agent sends full investigation report
[~7min]  Agent rotates canaries (tracebit deploy all + deploy email)
```

---

## Troubleshooting

### Wizard fails: "Invalid topicName"
The GCP project doesn't match the gog OAuth client project. Fix:
```bash
cat ~/.config/gogcli/client_secret_*.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(list(d.values())[0].get('project_id',''))"
gcloud config set project CORRECT_PROJECT_ID
```
Then re-run the wizard.

### Wizard fails: Tailscale not connected or Funnel not enabled
- Not connected: ask the human to run `tailscale up` and authenticate
- Funnel not enabled: navigate to the URL the wizard prints in the browser tool, click **Enable Funnel**, re-run wizard

### Wizard fails: gcloud not authenticated
Ask the human to run `gcloud auth login`. This is a prerequisite the agent cannot complete autonomously.

### Pub/Sub push marked "stale" on first test
```
[gog] watch: ignoring stale push historyId=X (stored=X)
```
Expected on the first alert after a wizard run. Wait for the next trigger — it will process normally.

### Port 8788 already in use
A manual daemon is conflicting with the gateway-managed one:
```bash
pkill -f "gog.*watch.*serve"
```
The gateway restarts it automatically.

### Alert email arrived but no agent session spawned
Check whether the daemon was running when the email arrived:
```bash
grep "watcher started\|watcher stopped" /tmp/openclaw-0/openclaw-$(date +%Y-%m-%d).log
```
If it was down, re-run `openclaw webhooks gmail run` and trigger another test.

### Gmail watch expired
The watch expires every 7 days; the gateway auto-renews it while running. If it has expired:
```bash
gog gmail watch start --account YOUR@gmail.com --label INBOX \
  --topic projects/YOUR_PROJECT_ID/topics/gog-gmail-watch
```

### Agent spawned but filters out the email
Check that the email sender and subject match exactly:
- From: `notifications@community.tracebit.com`
- Subject: `Tracebit Canary Triggered`

If either differs, update the filter instruction in `messageTemplate` accordingly.
