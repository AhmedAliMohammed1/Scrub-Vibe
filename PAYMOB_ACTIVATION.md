# Paymob activation runbook

## Current state

Paymob is implemented but intentionally held. Customers cannot see or select it unless `PAYMOB_ENABLED=true` and every required setting below is valid. Vodafone Cash, InstaPay and COD deposit verification continue independently.

## Required Vercel settings

- `PAYMOB_ENABLED=false` while onboarding is pending
- `PAYMOB_SECRET_KEY`
- `PAYMOB_PUBLIC_KEY`
- `PAYMOB_HMAC_SECRET`
- `PAYMOB_INTEGRATION_ID` — one or more positive IDs separated by commas
- `NEXT_PUBLIC_APP_URL=https://scrub-vibe-tau.vercel.app`

Never use a `NEXT_PUBLIC_` prefix for Paymob secrets.

## Callback configuration

- Transaction processed callback: `https://scrub-vibe-tau.vercel.app/api/payments/paymob/webhook`
- Customer redirect: generated per order as `/{locale}/track/{orderNumber}?payment=returned`
- The server callback is the payment source of truth; the browser redirect never marks an order paid.

## Activation checklist

1. Add Paymob test keys and integration IDs in Vercel, leaving `PAYMOB_ENABLED=false`.
2. Configure the transaction processed callback URL in Paymob.
3. Redeploy and confirm the admin orders page reports only `PAYMOB_ENABLED` as held.
4. Set `PAYMOB_ENABLED=true` in Preview first and redeploy.
5. Complete successful and declined sandbox payments.
6. Confirm duplicate callbacks produce one order transition and an audited duplicate outcome.
7. Confirm wrong amounts, currencies, integration IDs and signatures cannot mark an order paid.
8. Repeat with live credentials, then enable Production.

## Emergency stop

Set `PAYMOB_ENABLED=false` and redeploy. Existing orders and webhook audit records remain available, while new customers immediately stop seeing Paymob.
