# Incident-response runbook

## Severity

- **SEV-1:** checkout unavailable, data loss/corruption, security compromise, incorrect payment capture, or broad account exposure.
- **SEV-2:** a major customer/admin workflow is unavailable, fulfilment is blocked, or notification/cron failures accumulate.
- **SEV-3:** isolated defect with a workaround and no material data/payment risk.

## First 15 minutes

1. Assign incident commander, technical lead and communications owner.
2. Record start time, affected workflows, first known event and deployment commit.
3. Preserve Vercel runtime/build logs, Supabase logs/advisors and provider event IDs without copying secrets or PII.
4. Contain risk: disable Paymob, OTP, recovery emails or cron jobs as appropriate; do not delete evidence.
5. Decide whether to rollback code, forward-fix, or invoke database recovery.

## Diagnosis order

1. Liveness and readiness endpoints.
2. Recent deployment/build changes and environment-variable changes.
3. Vercel Runtime Logs filtered by route/request ID and `event`.
4. Supabase database/Auth/Storage logs, locks, advisors and migration history.
5. Resend, Twilio and Paymob dashboards using stored provider identifiers.

## Commerce-specific response

- For inventory mismatches, pause affected products, compare `inventory`, reservations and movements, and correct only through audited admin/database procedures.
- For failed or ambiguous payments, never infer success from a browser redirect. Use the Paymob transaction and verified webhook record, then reconcile the order.
- For delayed manual proofs, keep fulfilment blocked until staff approval.
- For notification failures, keep the order transaction successful, repair delivery separately and avoid duplicate customer messages.

## Recovery and closure

Verify English/Arabic storefront, auth, checkout, payment, tracking and staff workflows. Reconcile affected orders and payments, notify customers when service or financial expectations changed, monitor for recurrence, then write a blameless post-incident review within two business days with root cause, timeline, impact and preventive actions.
