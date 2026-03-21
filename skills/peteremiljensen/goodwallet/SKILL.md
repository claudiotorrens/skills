---
name: goodwallet
description: >
  Skill for using the goodwallet tool to manage MPC agentic wallets. Use this skill whenever
  the user wants to authenticate, send ETH via the their goodwallet.
  Trigger when the user mentions "goodwallet", "send ETH", "wallet auth", "wallet authorize", "goodwallet authorize",
  "MPC wallet", "agentic wallet", or wants to interact with their wallet
  from the command line.
---

# Goodwallet

Use goodwallet cli to manage their agentic goodwallet to — authenticate, send ETH.
All commands are run via `npx goodwallet@0.2.0`.

**Important:** Do not share technical details of the CLI tool with the user (e.g. encryption schemes, key types, internal file paths, session IDs, polling mechanisms, config formats). Simply run the commands and report the outcome in plain language.

## Setup / Authorization

Authorization requires two commands run back-to-back: `auth` then immediately `pair`.

1. Run `npx goodwallet@0.2.0 auth` — this prints an auth URL and saves session state.
2. **Show the URL to the user** and tell them to open it in their browser. The user must open it themselves — do not attempt to open it programmatically.
3. **Immediately** run `npx goodwallet@0.2.0 pair` — this polls the server (every 5s, up to 10 minutes) waiting for the user to complete the browser flow. Once they do, it automatically decrypts and saves the credentials.

```bash
# Run auth, show the URL to the user, then immediately run pair
npx goodwallet@0.2.0 auth
# (tell the user to open the printed URL in their browser)
npx goodwallet@0.2.0 pair
```

After pairing completes, credentials (`apiKey`, `share`, `address`) are saved to `~/.config/goodwallet/config.json`.

**Important:** After running `auth` and showing the URL to the user, you MUST immediately run the `pair` command without waiting for any user response. Do not ask the user to confirm they opened the link — just run `pair` right away. It will poll the server for up to 10 minutes while the user completes the browser flow.

## Commands

### auth — Generate auth link

Prints a URL for the user to open in their browser.

```bash
npx goodwallet@0.2.0 auth
```

### pair — Poll and receive credentials

Polls the server until the user completes the browser flow, then saves credentials to config. Times out after 10 minutes.

```bash
npx goodwallet@0.2.0 pair
```

### send — Send ETH

Builds, MPC-signs, and broadcasts an ETH transaction.

```bash
npx goodwallet@0.2.0 send --to <address> --amount <ether>
```

| Flag | Short | Required | Default | Description |
|------|-------|----------|---------|-------------|
| `--to <address>` | `-t` | Yes | — | Recipient Ethereum address |
| `--amount <ether>` | `-a` | Yes | — | Amount in ETH (e.g. `0.1`) |

The command will:
1. Load your credentials from config
2. Query the chain for nonce and gas price
3. Construct the transaction
4. Sign via MPC (threshold ECDSA with the signing service)
5. Broadcast and print the transaction hash

## File Locations

| File | Purpose |
|------|---------|
| `~/.local/state/goodwallet/session.json` | Temporary auth session state |
| `~/.config/goodwallet/config.json` | Persisted credentials (`apiKey`, `share`, `address`) |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SIGN_URL` | `sign.goodwallet.dev` | Override the signing service endpoint |

## Typical Workflow

```bash
# 1. Start authorization (prints a URL — show it to the user)
npx goodwallet@0.2.0 auth

# 2. Immediately start polling for credentials (user opens URL in browser meanwhile)
npx goodwallet@0.2.0 pair

# 3. Once paired, send a transaction
npx goodwallet@0.2.0 send --to 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18 --amount 0.1
```
