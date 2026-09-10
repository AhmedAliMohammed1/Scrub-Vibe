# Monitoring and escalation runbook

## Signals

- Vercel health checks, function status/latency and structured `request.failed` events.
- Supabase connectivity, advisors, database/storage errors and capacity.
- Checkout 5xx responses, rejected Paymob callbacks and stale payment-review orders.
- Pending proof age, expired reservation cleanup and low-stock alerts.
- Resend failures, cron failures and abandoned-cart/commercial automation summaries.

## Alert thresholds

- Page immediately: liveness/readiness unavailable for two consecutive checks, checkout 5xx spike, suspected data exposure, incorrect payment state or inventory oversell.
- Same business day: proof older than `OPERATIONS_PROOF_REVIEW_HOURS` (default 12), payment review older than `OPERATIONS_PAYMENT_REVIEW_HOURS` (default 24), rejected webhook in the configured lookback, or cron failure.
- Planned response: low stock, dependency advisories without known exploitation, performance regression without failed requests.

## Vercel setup

Runtime Logs are the baseline on all plans. Save filters for `level:error`, `/api/checkout/orders`, `/api/payments/paymob/webhook`, `/api/cron/` and `/api/health/`. On a plan supporting Alerts, configure function-error anomaly notifications. Otherwise rely on the hourly GitHub smoke workflow plus staff emails and periodically export logs to a controlled drain.

## Secrets

- `CRON_SECRET`: at least 16 random characters; required and fail-closed.
- `OPERATIONS_SECRET`: separate long random value for detailed readiness output.
- Never use a `NEXT_PUBLIC_` prefix for either secret.

Rotate both after disclosure, remove old values from every Vercel environment and redeploy.

## References

- [Vercel Observability](https://vercel.com/docs/observability)
- [Vercel Runtime Logs](https://vercel.com/docs/logs/runtime)
- [Vercel Cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
