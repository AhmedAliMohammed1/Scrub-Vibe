# Architectural decisions

## ADR-001 — Supabase PostgreSQL as system of record

**Status:** Accepted. **Reason:** Commerce data is relational and needs transactions, constraints, auditability and row-level authorization.

## ADR-002 — Repository boundary with explicit development adapter

**Status:** Accepted. **Reason:** Pages can run without credentials while production remains database-first. The demo adapter is labelled and cannot be mistaken for the production store.

## ADR-003 — Locale-prefixed App Router

**Status:** Accepted. **Reason:** `/en` and `/ar` provide indexable, shareable locale URLs and deterministic `dir` switching. A message framework can replace the compact dictionary when translation volume grows.

## ADR-004 — Money in integer minor units

**Status:** Accepted. **Reason:** Avoids floating-point pricing defects and maps cleanly to payment providers.

## ADR-005 — Provider abstractions for payments, shipping and email

**Status:** Accepted. **Reason:** Paymob/COD, Egyptian couriers and Resend must be replaceable and testable without leaking provider concerns into checkout.

## ADR-006 — Original editorial identity

**Status:** Accepted. **Reason:** The reference informs structure only. NOVA Cairo uses original copy, generated photography and a sand/clay/olive visual system.
