# Quickstart

End-to-end guide for getting a human from zero to chatting with a Face. Follow these steps in order.

## 1. Install the CLI

```bash
npm install -g faces-cli
```

Verify: `faces --version`

## 2. Register an account

```bash
RESULT=$(faces auth:register --email USER_EMAIL --password 'USER_PASSWORD' --username USERNAME --json)
echo "$RESULT" | jq -r '.activation_checkout_url'
```

This creates the account and returns a Stripe Checkout URL. The account is not yet active.

Tell the human:

> Paste this link into your browser and complete the payment ($5 minimum, added as API credits). When you see the confirmation page, come back and let me know.

Wait for the human to confirm, then verify:

```bash
faces billing:balance --json | jq '.is_active'
```

If `true`, proceed. If `false`, the payment may not have gone through — ask the human to try the link again.

## 3. Create a Face

```bash
faces face:create --name "Alice Smith" --username alice --json
```

Save the face `id` (username) — you'll need it for the next steps.

## 4. Add source material

Pick one or more methods depending on what the human has:

**Local file (text, PDF):**
```bash
DOC_ID=$(faces face:upload alice --file /path/to/document.pdf --kind document --json | jq -r '.document_id // .id')
```

**YouTube video (solo speaker):**
```bash
IMPORT=$(faces compile:import alice \
  --url "https://www.youtube.com/watch?v=VIDEO_ID" \
  --type document --perspective first-person --json)
DOC_ID=$(echo "$IMPORT" | jq -r '.document_id // .doc_id // .id')
```

**YouTube video (multi-speaker interview):**
```bash
IMPORT=$(faces compile:import alice \
  --url "https://www.youtube.com/watch?v=VIDEO_ID" \
  --type thread --perspective first-person --face-speaker "Alice" --json)
THREAD_ID=$(echo "$IMPORT" | jq -r '.thread_id // .id')
```

If `--type thread` fails with 422, retry with `--type document`.

**Raw text:**
```bash
DOC_ID=$(faces compile:doc:create alice --label "Notes" --content "Text here..." --json | jq -r '.id')
```

## 5. Compile

For documents (including uploads and YouTube-as-document):

```bash
# Prepare (may complete immediately or return "processing")
faces compile:doc:prepare "$DOC_ID"

# If status is not yet "ready", poll until it is
while [ "$(faces compile:doc:get "$DOC_ID" --json | jq -r '.status')" != "ready" ]; do
  sleep 5
done

# Sync to build the Face
faces compile:doc:sync "$DOC_ID" --yes
```

For threads:

```bash
faces compile:thread:sync "$THREAD_ID"
```

## 6. Chat

```bash
# OpenAI model via chat completions
faces chat:chat alice --llm gpt-4o-mini -m "What matters most to you?"

# Anthropic model via native messages endpoint
faces chat:messages alice@claude-sonnet-4-6 -m "What matters most to you?"

# OpenAI model via responses endpoint
faces chat:responses alice@gpt-4o-mini -m "What matters most to you?"
```

## 7. Verify it worked

```bash
faces face:get alice --json | jq '{name, component_counts}'
```

If `component_counts` shows non-null values, the Face is compiled and ready.

## What's next

- **Add more material** — repeat steps 4–5 to deepen the Face. Each sync adds to the existing knowledge.
- **Create more Faces** — repeat steps 3–5 for each persona.
- **Compare Faces** — `faces face:diff --face alice --face bob`
- **Compose Faces** — `faces face:create --username alice-and-bob --formula "alice | bob"`
- **Use templates** — reference multiple faces in a single prompt: `faces chat:messages gpt-4o-mini -m 'Compare ${alice} and ${bob}.'`
- **Connect ChatGPT** (connect plan) — `faces auth:connect openai` for free gpt-5.x inference. See [OAUTH.md](OAUTH.md).
- **Create an API key** — `faces keys:create --name "my-key"` for programmatic access. See [AUTH.md](AUTH.md).
