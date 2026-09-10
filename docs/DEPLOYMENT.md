# Deployment

Vercel production deployment targets `main`; pull requests receive preview deployments. Production is hosted at `https://scrub-vibe-tau.vercel.app` and linked to Supabase project `iqufqtjotgpmhhtvlxwf`.

Configure secrets in Vercel rather than committing them. Use `.env.example` as the environment contract. Server-controlled flag changes require redeployment. Paymob remains disabled until `PAYMOB_ACTIVATION.md` passes; OTP uses `CHECKOUT_PHONE_OTP_ENABLED`; scheduled automation requires `CRON_SECRET`.

Before sign-off, confirm the deployment commit, environment readiness, cron execution, email delivery, Supabase advisors and critical browser journeys.

Production probes are `/api/health/live` and `/api/health/ready`. Configure separate `CRON_SECRET` and `OPERATIONS_SECRET` values; never expose either with `NEXT_PUBLIC_`. Follow `docs/runbooks/RELEASE_ROLLBACK.md` for every production promotion or rollback.
