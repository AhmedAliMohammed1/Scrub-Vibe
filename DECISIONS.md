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

## ADR-007 — Database-backed RBAC with private policy helper

**Status:** Accepted. **Reason:** Roles are server-controlled relational data. A private `security definer` helper performs indexed role lookup for RLS, explicitly checks `auth.uid()`, fixes its search path and revokes broad execution.

## ADR-008 — Supabase session refresh in Next.js 16 Proxy

**Status:** Accepted. **Reason:** Server Components cannot write refreshed cookies. Proxy verifies claims before rendering and propagates the cache-prevention headers supplied by the current SSR client.

## ADR-009 — Explicit Paymob activation and callback source of truth

**Status:** Accepted. **Reason:** Paymob stays unavailable unless `PAYMOB_ENABLED=true` and every credential/callback setting is valid. Server-to-server HMAC callbacks—not browser redirects—are authoritative. Callback identities are deduplicated in PostgreSQL, successful payments cannot be downgraded by later failures, and only payload digests plus operational identifiers are retained for audit.

## ADR-010 — Server-authoritative shipping quotes with immutable order snapshots

**Status:** Accepted. **Reason:** The checkout UI may preview delivery charges, but the order transaction validates the selected Egyptian governorate/city and recalculates the zone fee, free-shipping discount and COD surcharge from live database settings. Each order stores the resulting zone, destination labels, charge breakdown and delivery window so later admin rate changes cannot rewrite the commercial terms promised to the customer.

## ADR-011 — Multi-stage transactional order lifecycle notifications

**Status:** Accepted. **Reason:** Customers receive real-time, non-blocking bilingual (Arabic/English) email notifications throughout their entire order lifecycle (Order Placed, Payment Approved, In Preparation, Shipped with Tracking, Out for Delivery, Delivered, and Cancelled), as well as on any staff update note. Sending failures never abort administrative or customer transactions, and sandbox/unverified sender domains safely fall back to Resend's onboarding domain to avoid delivery disruptions.

## ADR-012 — Hybrid size chart architecture with client-side recommendation engine

**Status:** Accepted. **Reason:** Medical scrub sizing requires standard collection measurements (Women, Men, Unisex) for baseline consistency, while allowing granular per-product overrides for specialized cuts (joggers, lab coats, slim-fit sets). The database stores measurements in `size_chart_entries` with public read RLS and role-restricted admin management. On the storefront, pure client calculation evaluates multi-dimensional body measurements (Chest, Waist, Hips) with configurable units (cm/inches) and recommends optimal sizes restricted to the product's actual stock inventory without leaking network latency.

## ADR-013 — Server-authoritative promotions with immutable redemption snapshots

**Status:** Accepted. **Reason:** Discount eligibility and amounts must never trust browser totals. PostgreSQL locks and revalidates the code, campaign, live variant prices, schedules, usage limits, customer limits and budgets in the same transaction that reserves inventory and creates the order. Orders and redemptions retain code/campaign names and monetary snapshots so later campaign edits cannot rewrite historical commercial terms. Promotion RPCs are executable only by the server service role, while RLS limits campaign management and reporting to authorized staff.

## ADR-014 — Customer Saved Addresses & Checkout Prefill Architecture

**Status:** Accepted. **Reason:** Healthcare professionals frequently purchase scrubs for delivery to specialized clinical locations (hospitals, clinics, surgery centers) or home. Customer delivery addresses are stored in `customer_addresses` with owner-scoped RLS and foreign-key constraints to Egyptian `shipping_governorates`. A PostgreSQL trigger transparently enforces single-default logic on insert, update, and delete. At checkout, registered customers can 1-click apply saved addresses—which instantly updates delivery zones, shipping rates, and COD rules without manual re-entry—or choose to save new delivery destinations directly from the checkout form.

