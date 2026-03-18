---
name: goodwallet-trading
description: >
  Blockchain trading and DeFi tools for GoodWallet MPC agentic wallets.
  Extends the base goodwallet skill with ERC20 transfers, token approvals,
  balance checking, DEX swaps, and arbitrary smart contract calls.
  Trigger when the user mentions "send tokens", "ERC20", "swap", "trade",
  "approve", "allowance", "token balance", "contract call", "DeFi",
  or wants to interact with smart contracts using their MPC wallet.
---

# GoodWallet Trading

Blockchain trading tools for GoodWallet MPC wallets. Extends `goodwallet` with ERC20 transfers, token approvals, balance checking, DEX swaps, and arbitrary contract calls — all using real Sodot MPC signing.

**Requires:** `goodwallet` must be installed and configured first (`npx goodwallet auth`).

## Commands

All commands use `goodwallet-trading` CLI. Credentials are read from `~/.config/goodwallet/config.json` (shared with `goodwallet`).

### balance — Check ETH and ERC20 balances

```bash
goodwallet-trading balance
goodwallet-trading balance --token 0x<erc20-address>
```

| Flag | Required | Description |
|------|----------|-------------|
| `--token <address>` | No | ERC20 token contract to check |
| `--rpc <url>` | No | Override RPC URL |

### erc20-send — Send ERC20 tokens

```bash
goodwallet-trading erc20-send --to <recipient> --amount <amount> --token <token-address>
```

| Flag | Required | Description |
|------|----------|-------------|
| `--to <address>` | Yes | Recipient address |
| `--amount <amount>` | Yes | Human-readable amount (e.g. `10.5`) |
| `--token <address>` | Yes | ERC20 token contract |

### approve — Approve token spending

```bash
goodwallet-trading approve --token <token-address> --spender <spender-address>
goodwallet-trading approve --token <token-address> --spender <spender-address> --amount 100
```

| Flag | Required | Description |
|------|----------|-------------|
| `--token <address>` | Yes | ERC20 token contract |
| `--spender <address>` | Yes | Address to approve (e.g. DEX router) |
| `--amount <amount>` | No | Amount to approve (default: unlimited) |

### contract-call — Execute any smart contract function

```bash
goodwallet-trading contract-call --to <contract> --data <calldata> --value <eth-amount>
```

| Flag | Required | Description |
|------|----------|-------------|
| `--to <address>` | Yes | Contract address |
| `--data <hex>` | Yes | ABI-encoded calldata (0x-prefixed) |
| `--value <ether>` | No | ETH to send with call (default: 0) |

This is the most powerful command — it lets you call ANY smart contract function. Construct the calldata using ABI encoding tools, then sign and broadcast via MPC.

### swap — DEX swap via Uniswap V2 router

```bash
goodwallet-trading swap --router <router-address> --from-token ETH --to-token <token> --amount 0.1
goodwallet-trading swap --router <router-address> --from-token <tokenA> --to-token <tokenB> --amount 100
```

| Flag | Required | Description |
|------|----------|-------------|
| `--router <address>` | Yes | Uniswap V2 router contract |
| `--from-token <addr>` | Yes | Token to sell (or `ETH`) |
| `--to-token <addr>` | Yes | Token to buy (or `ETH`) |
| `--amount <amount>` | Yes | Amount to swap |
| `--slippage <percent>` | No | Slippage tolerance (default: 1%) |

### token-info — Get ERC20 token details

```bash
goodwallet-trading token-info --token <token-address>
```

### allowance — Check approved spending

```bash
goodwallet-trading allowance --token <token-address> --spender <spender-address>
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SIGN_URL` | `sign.goodwallet.dev` | MPC signing service |
| `RPC_URL` | Hoodi Alchemy endpoint | Override RPC endpoint |

## Typical DeFi Workflow

```bash
# 1. Check balance
goodwallet-trading balance

# 2. Check token balance
goodwallet-trading balance --token 0x<token>

# 3. Approve DEX router to spend tokens
goodwallet-trading approve --token 0x<token> --spender 0x<router>

# 4. Swap tokens
goodwallet-trading swap --router 0x<router> --from-token 0x<tokenA> --to-token 0x<tokenB> --amount 10

# 5. Send tokens to another address
goodwallet-trading erc20-send --to 0x<recipient> --amount 5 --token 0x<token>
```

## How It Works

1. Reads MPC credentials from `~/.config/goodwallet/config.json` (API key, ECDSA key share, EVM address)
2. Constructs unsigned transaction with viem (gas estimation, nonce, calldata encoding)
3. Hashes the serialized unsigned transaction (keccak256)
4. Sends hash to `sign.goodwallet.dev/agent/sign/ecdsa` to initiate MPC signing room
5. Performs client-side MPC signing using Sodot native SDK (the user's key share)
6. Broadcasts the signed transaction via RPC

All signing is 2-of-3 threshold ECDSA — the user's share never leaves the machine.

## Installation

The `goodwallet-trading` CLI is pre-installed on this machine. If you need to install it elsewhere:

```bash
cd /home/quant/.openclaw/workspace-agentwallet/goodwallet-trading
npm install
npm link
```

## Notes

- Currently configured for **Hoodi testnet** (chain ID 560048). For mainnet, set `--rpc` to a mainnet RPC URL.
- The `swap` command uses Uniswap V2 ABI. For V3, use `contract-call` with the appropriate calldata.
- Always check `allowance` before swapping — DEX routers need token approval first.
