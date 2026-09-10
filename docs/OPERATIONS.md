# Production operations

This document is the operator index for Scrub Vibe production. Detailed procedures are in `docs/runbooks/`.

## Service objectives

- Storefront and checkout availability target: 99.9% monthly.
- Checkout/order-creation error rate: below 1% over 15 minutes.
- Payment-proof review: within 12 hours.
- Orders in payment review: resolved within 24 hours.
- Critical incident acknowledgement: within 15 minutes.
- Recovery point objective (RPO): 24 hours without PITR; 1 hour or better when PITR is enabled.
- Recovery time objective (RTO): 4 hours for application/database recovery.

## Runtime controls

- `GET /api/health/live` is a dependency-free liveness probe.
- `GET /api/health/ready` checks required configuration and Supabase connectivity. Its public response is intentionally minimal; send `Authorization: Bearer $OPERATIONS_SECRET` for component details.
- Next.js `src/instrumentation.ts` emits structured JSON for runtime startup and uncaught server errors.
- Cron routes fail closed unless `CRON_SECRET` is configured and supplied by Vercel.
- The commercial cron releases expired reservations and escalates stale proofs, stale payment reviews and rejected Paymob callbacks in addition to stock automation.
- GitHub runs an hourly production smoke monitor and a weekly dependency/CodeQL security workflow.

## Daily operator checks

1. Confirm both health endpoints pass and review Vercel Runtime Logs for `level:error`.
2. Check Vercel Cron history for abandoned-cart and commercial jobs.
3. Review admin queues: payment proofs, fulfilment, returns, reviews and inventory alerts.
4. Resolve stale-payment alerts before fulfilment proceeds.
5. Confirm Resend delivery failures and staff-alert routing.

## Weekly checks

1. Review GitHub Security workflow results and dependency advisories.
2. Review Supabase security and performance advisors.
3. Create and verify an encrypted, off-site logical database and Storage backup.
4. Inspect rejected Paymob events and reconcile them against the provider dashboard when Paymob is active.
5. Confirm staff/admin access remains appropriate.

## Runbooks

- [Backup and restore](runbooks/BACKUP_RESTORE.md)
- [Release and rollback](runbooks/RELEASE_ROLLBACK.md)
- [Incident response](runbooks/INCIDENT_RESPONSE.md)
- [Monitoring and escalation](runbooks/MONITORING.md)

Never paste customer data, access tokens, payment proofs or database connection strings into tickets or logs.
