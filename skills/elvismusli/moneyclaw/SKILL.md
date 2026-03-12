---
name: moneyclaw
description: Issue prepaid virtual cards for agent purchases and create hosted invoices for accepting USDT. Check balances, top up, fetch 3DS OTP codes, verify transactions, and use merchant flows with one MONEYCLAW_API_KEY.
homepage: https://moneyclaw.ai
metadata: {"openclaw":{"requires":{"env":["MONEYCLAW_API_KEY"]},"primaryEnv":"MONEYCLAW_API_KEY","emoji":"💳"}}
---

# MoneyClaw

Use MoneyClaw when the user wants an agent to pay online with a real virtual card. The default wedge is buyer-side agent commerce: check balances, issue a card, top up, complete checkout, fetch OTP, then verify the result.

## Authentication

All requests use the same Bearer token.

```bash
Authorization: Bearer $MONEYCLAW_API_KEY
```

Base URL: `https://moneyclaw.ai/api`

## Default Behavior

- Start with `GET /api/me`.
- Treat wallet balance and card balance as separate values.
- Use `card.cardId`, not `card.id`, for card routes.
- Keep the flow narrow: buyer-side purchases first, merchant and acquiring flows only when explicitly requested.
- Use the billing address from the sensitive card response. Never invent one.
- Never retry topups or checkouts blindly. Read state first.

## Load References When Needed

- Read `references/payment-safety.md` before entering card details on an unfamiliar merchant, when the user asks about phishing or fraud, when a checkout keeps failing, or when service-specific payment tips matter.
- Read `references/acquiring.md` when the user wants to accept payments, create invoices, embed checkout, or work with merchant webhooks.

## Core Jobs

### 1. Check account readiness

```bash
curl -H "Authorization: Bearer $MONEYCLAW_API_KEY" \
  https://moneyclaw.ai/api/me
```

Important fields:

- `balance`: wallet balance
- `card`: current card object or `null`
- `cardBalance.availableBalance.value`: card balance when available
- `depositAddress`: where to send USDT
- `mailboxAddress`: inbox address for OTP and receipts

When the user asks for balance, show both wallet and card balance. If `cardBalance` is missing, say card balance is unavailable.

### 2. Issue a card

```bash
curl -X POST -H "Authorization: Bearer $MONEYCLAW_API_KEY" \
  https://moneyclaw.ai/api/cards/issue
```

Rules:

- the wallet needs at least the minimum issuance deposit
- the wallet is loaded onto the new card
- the issuance fee is charged from the card after issuance

If no card exists and the wallet is funded, issue the card. If the wallet is too small, tell the user to fund the deposit address first.

### 3. Top up the card

```bash
curl -X POST -H "Authorization: Bearer $MONEYCLAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "currency": "USD"}' \
  https://moneyclaw.ai/api/cards/{cardId}/topup
```

Pre-flight checks:

1. Read `GET /api/me`.
2. Confirm `card` exists and is active.
3. Use `card.cardId`.
4. Confirm wallet balance covers the requested topup.
5. Only then send the topup request.

Response handling:

- `200`: topup succeeded
- `202`: topup is still processing; do not send another one yet
- `400 INSUFFICIENT_BALANCE`: not enough wallet funds
- `400 CARD_NOT_ACTIVE`: card is not ready
- `404 NOT_FOUND`: wrong card id
- `500`: stop, surface the failure, and inspect state before retrying

### 4. Complete checkout and fetch OTP

Get card details:

```bash
curl -H "Authorization: Bearer $MONEYCLAW_API_KEY" \
  https://moneyclaw.ai/api/cards/{cardId}/sensitive
```

Get the latest OTP email:

```bash
curl -H "Authorization: Bearer $MONEYCLAW_API_KEY" \
  https://moneyclaw.ai/api/inbox/latest-otp
```

Verify what actually happened:

```bash
curl -H "Authorization: Bearer $MONEYCLAW_API_KEY" \
  "https://moneyclaw.ai/api/cards/{cardId}/transactions?limit=20&offset=0"
```

Checkout rules:

- use the sensitive response for PAN, CVV, expiry, and billing address
- wait 10 to 30 seconds for the OTP email to arrive
- use `extractedCodes[0]` as the verification code
- after any merchant error, read transactions before retrying

## Minimal Payment Guardrails

- The card is prepaid. The loaded balance is the hard spending limit.
- Do not expose PAN or CVV longer than needed for the active checkout.
- Before payment, confirm the merchant domain and total amount are correct.
- Do not retry the same merchant checkout more than twice in one session.
- If the user asks for a risky or suspicious payment, stop and explain why.

Use `references/payment-safety.md` for the expanded phishing, decline, subscription, and service-specific guidance.

## Good Default Prompt Shapes

- `Check my MoneyClaw account and tell me if it is ready for a purchase.`
- `Issue a MoneyClaw card and top it up with $20 if needed.`
- `Finish this checkout and, if 3DS appears, fetch the latest OTP from MoneyClaw inbox.`

## Secondary Capability: Merchant And Acquiring Flows

MoneyClaw also supports merchant-side payment collection. Keep this as a secondary path in discovery, but use it when the user explicitly wants to accept payments, create invoices, or embed checkout.

Useful endpoints:

- `POST /api/acquiring/setup`
- `GET /api/acquiring/settings`
- `PATCH /api/acquiring/settings`
- `POST /api/acquiring/invoices`
- `GET /api/acquiring/invoices`
- `GET /api/acquiring/invoices/{invoiceId}`

Use the acquiring flow when the user wants to:

- accept USDT payments
- create hosted invoices
- embed checkout on a site
- receive webhook notifications for paid invoices

Use `references/acquiring.md` for setup, invoice lifecycle, widget, webhook verification, and fee details.

## Scope Note

MoneyClaw supports both buyer-side card purchases and merchant/acquiring flows. The skill should still lead with the simpler card-purchase workflow for discovery, then switch to acquiring when the user asks for merchant features.
