---
name: card-news
description: Return material news about one major-US credit card from the last 3 months — direct card changes, issuer updates, and major coverage. Covers Amex, Chase, Capital One, Citi, Bank of America, Discover, and Wells Fargo.
metadata:
  openclaw:
    requires:
      env:
        - BRAVE_API_KEY
      bins:
        - curl
    primaryEnv: BRAVE_API_KEY
---

# Card News

Return the last-3-month news view of one exact card variant in compact format.

## When To Use

When the user asks about recent changes, news, or updates for a credit card. Trigger phrases: "card-news", "any changes", "recent news", "what's new with", "updates for".

## Workflow

1. **Resolve card identity** — normalize and match to one exact variant. If ambiguous, return a numbered choice list and stop.
2. **Search** — run one Brave Search API call with freshness filter for recent results.
3. **Filter** — apply 3-month lookback window and inclusion rules.
4. **Compile** — assemble the news report.
5. **Confidence** — flag uncertain or conflicting claims.

## Step 1: Card Identity Resolution

### Common Abbreviations

| Input | Resolved |
|---|---|
| CSP | Chase Sapphire Preferred |
| CSR | Chase Sapphire Reserve |
| CFU | Chase Freedom Unlimited |
| CFF | Chase Freedom Flex |
| Amex Gold | American Express Gold Card |
| Amex Plat | American Express Platinum Card |
| Venture X | Capital One Venture X Rewards Credit Card |
| Savor | Capital One SavorOne / Savor (ambiguous — ask) |
| Double Cash | Citi Double Cash Card |
| Custom Cash | Citi Custom Cash Card |

### Supported Issuers

American Express, Bank of America, Capital One, Chase, Citi, Discover, Wells Fargo.

## Step 2: Search

Run one Brave Search API call with freshness filter:

```bash
curl -sS "https://api.search.brave.com/res/v1/web/search?q=CARD+NAME+news+CURRENT_YEAR&count=20&freshness=pm" \
  -H "X-Subscription-Token: $BRAVE_API_KEY"
```

The `freshness=pm` parameter limits results to the past month. Replace `CURRENT_YEAR` with the actual current year.

### Source Policy

- **Issuer newsrooms first**: check issuer blogs and press release pages.
- **Max 5 secondary sources** from: Doctor of Credit (preferred), The Points Guy (preferred), One Mile at a Time (preferred), NerdWallet (preferred), Bankrate (preferred), Upgraded Points.
- **Disallowed**: Reddit, Facebook, Instagram, TikTok, X, YouTube, referral links, user forums.

## Recency Rules

- Use a **3-month lookback window** only.
- **Include**: direct card changes, issuer updates that materially affect the card, major approved-site coverage that changes how the card should be understood.
- **Exclude**: generic issuer chatter, evergreen "best card" articles that do not describe a recent change.

## Required Output Sections

### `## 📅 News Window`
Start and end dates of the 3-month lookback window.

### `## 📰 Recent Updates`
Numbered list of material changes with date and short summary per item.

### `## 📝 Summary`
2-3 sentence synthesis of what changed and what stayed the same.

### `## 📋 Confidence Notes`
Flag any uncertain, unconfirmed, or conflicting claims.

## Output Rules

- Use one emoji per section heading and numbered lists for updates.
- Keep content to condensed facts — no prose padding.
- Omit the Card Identity section when the match is confident.
- Do not show inline links, sources footer, or YAML blocks in output.

## Confidence Definitions

- **confirmed**: supported by issuer terms or multiple approved sources
- **unconfirmed**: plausible but not fully resolved
- **conflicting**: sources disagree on a material fact
