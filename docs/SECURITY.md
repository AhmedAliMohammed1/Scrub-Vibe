# Security

- Secrets are server-only and excluded from source control.
- Prices, promotions, inventory and payment states are recalculated or verified server-side.
- Webhooks require signature verification and idempotency.
- RLS and least-privilege grants protect exposed tables.
- Analytics excludes unnecessary personal data.
- Administrative changes create immutable audit events.
- Scheduled routes fail closed and require `CRON_SECRET`; detailed readiness output separately requires `OPERATIONS_SECRET`.
- Operational logs use structured event names and codes without request bodies, tokens or customer details.
- Weekly CI runs dependency auditing and CodeQL analysis.
- Supabase leaked-password protection should be enabled after upgrading to Pro; the current Free plan does not expose this Auth protection for activation.

Follow `docs/runbooks/INCIDENT_RESPONSE.md` for suspected compromise. Rotate affected credentials, preserve audit evidence and verify Supabase RLS/advisors before restoring normal operation.
