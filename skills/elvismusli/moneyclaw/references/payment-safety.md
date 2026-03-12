# Payment Safety Reference

Use this reference when:

- you are about to enter card details on an unfamiliar site
- the user asks about phishing, fraud, or safe checkout behavior
- a merchant declines payment and you need retry guidance
- service-specific payment tips matter

## Table of Contents

1. Hard Stops
2. Pre-Payment Checklist
3. Service-Specific Tips
4. Retry And Decline Rules
5. Subscription And Currency Traps

## 1. Hard Stops

Stop immediately if any of these are true:

- the domain is not the expected merchant domain
- the amount on the payment form does not match the expected total
- the form asks for SSN, passport, PIN, security questions, or bank account data
- the page asks for the CVV or OTP more than the normal checkout flow requires
- the billing address on the form does not match the card credentials and the user has not asked for a service-specific exception
- the site pressures with obvious scam signals: fake countdowns, absurd discounts, or forced off-platform payment

## 2. Pre-Payment Checklist

Run this checklist before entering card details:

1. Verify the exact domain. In `paypal.com.secure-verify.net`, the real domain is `secure-verify.net`.
2. Confirm HTTPS is present, but do not treat HTTPS alone as proof of legitimacy.
3. Confirm the total amount and currency.
4. Confirm card balance covers the amount plus a small buffer.
5. Use the billing address from the card credentials. Do not invent one.
6. Use a clean browser or incognito session when a merchant is known to be sensitive.
7. If location matters for the merchant, use a VPN in the card's issuing country.

## 3. Service-Specific Tips

### General recommendations from provider research

These improve approval odds on many services:

- use a VPN, ideally in the card's issuing country
- use an incognito or otherwise clean browser session
- use an international email domain when a site is sensitive to regional addresses
- if a phone number is required, use one from the card's issuing country
- use the cardholder name from the card credentials in a realistic `Name Surname` format
- use the billing address from the card credentials unless a service-specific exception applies

### OpenAI subscription checkout

Provider-side research suggested a specific override for OpenAI subscriptions:

- use a US VPN before opening the browser
- cardholder name: `Howard Willis`
- billing address:
  - country: `Angola`
  - city: `Luanda`
  - address: `Rua Frederik Engels 92-7`

Important:

- this applies to OpenAI subscription checkout only
- it does not apply to API billing or general-purpose purchases

If unsure, prefer the normal card credentials over overrides.

## 4. Retry And Decline Rules

- never retry immediately after a merchant error; read transaction history first
- maximum two retries per merchant session unless the user explicitly wants deeper troubleshooting
- if topup returns `202`, wait and re-check state instead of sending another topup
- do not keep retrying after repeated CVV or verification failures

Common guidance:

- `INSUFFICIENT_BALANCE`: top up or reduce purchase amount
- `CARD_NOT_ACTIVE`: card is not ready yet
- merchant-side error with no clear payment result: read `/api/cards/{cardId}/transactions` before trying again

## 5. Subscription And Currency Traps

Watch for these patterns:

- free trials that auto-convert to paid subscriptions
- hidden fees that appear only at final checkout
- pre-checked upsells
- cancellation flows designed to be difficult

For foreign-currency checkouts:

- decline Dynamic Currency Conversion if offered
- pay in the merchant's local currency when possible
- let the card network handle conversion instead of the merchant
