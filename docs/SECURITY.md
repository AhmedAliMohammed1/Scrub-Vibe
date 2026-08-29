# Security

- Secrets are server-only and excluded from source control.
- Prices, promotions, inventory and payment states are recalculated or verified server-side.
- Webhooks require signature verification and idempotency.
- RLS and least-privilege grants protect exposed tables.
- Analytics excludes unnecessary personal data.
- Administrative changes create immutable audit events.

Threat-model and test these controls before any production launch.
