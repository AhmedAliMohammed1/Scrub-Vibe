# Payments and phone verification

Scrub Vibe supports four Egypt-focused checkout methods:

- Cash on delivery creates a confirmed order with payment due at delivery.
- Vodafone Cash and InstaPay require a JPG, PNG or WebP transfer screenshot. The proof is stored in the private `payment-proofs` bucket and must be approved by staff before fulfilment.
- Paymob Unified Checkout is the automated option for cards and the mobile-wallet integrations enabled on the merchant account. Paymob webhook HMAC verification is the only source of truth for payment success.

The server always recalculates prices from active Supabase variants, locks inventory, and reserves it in the same database transaction. Browser totals and product descriptions are never trusted.

## Production setup

1. Create and verify an Egypt Paymob merchant account.
2. Enable the card and mobile-wallet integrations required by the store. Vodafone Cash is included in Paymob's supported Egyptian mobile wallets when enabled for the account.
3. Set `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, and a comma-separated `PAYMOB_INTEGRATION_ID` list in Vercel Production, Preview and Development as appropriate.
4. Configure the Paymob processed callback as `https://scrub-vibe-tau.vercel.app/api/payments/paymob/webhook`.
5. Set `NEXT_PUBLIC_VODAFONE_CASH_NUMBER` and `NEXT_PUBLIC_INSTAPAY_ADDRESS` to enable the manual transfer choices.

InstaPay does not expose a general merchant checkout API for this integration. It is intentionally handled as a manual bank transfer with protected proof review.

## OTP setup

Checkout phone verification uses Twilio Verify so it does not replace an existing Supabase email session. Create a Verify Service and set:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SERVICE_SID`
- `OTP_RATE_LIMIT_SALT` to a long random secret

The application accepts Egyptian mobile numbers only, limits OTP sends per phone and IP, and issues a single-use 15-minute checkout token after successful verification. `CHECKOUT_TEST_OTP` is available for local development only and is ignored in production.

Never store card data, OTP codes, Paymob secrets, Twilio secrets, or payment screenshots in public storage.
