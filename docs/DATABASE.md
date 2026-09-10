# Database

## Hosted project

- Project ref: `iqufqtjotgpmhhtvlxwf`
- PostgreSQL: 17.6
- Schema history: all reviewed files in `supabase/migrations/`, through customer reviews and review-policy optimization, were applied during their feature checkpoints
- Public application tables use RLS and explicit grants; private payment/return evidence is stored in protected buckets
- Seeded catalogue: 9 bilingual Scrub Vibe products with colour/size variants and inventory

The target model is normalized around products → options → values → variants, with per-variant inventory and append-only movements. Orders snapshot product, variant, price and tax display data to remain historically accurate.

Every public-schema table must explicitly enable RLS. Grants and policies are treated as separate controls. Authorization roles live in server-controlled data/app metadata, never editable user metadata.

## Implemented data model

The foundation migration creates normalized profile/RBAC, catalogue, variant, inventory and append-only movement tables. Later migrations add orders, payment proofs/webhook audits, shipping, carts/wishlists, addresses, discounts, size charts, CMS, recovery automation, commercial merchandising, stock subscriptions/alerts, returns and verified product reviews. Money uses integer minor units and timestamps use `timestamptz`.

Client grants are revoked globally and selectively restored. Public policies expose only publishable catalogue and approved-review data, customer records are owner-scoped, and staff capabilities are role-scoped. Staff checks use a private, locked-down role lookup rather than editable user metadata.

The production storefront reads normalized rows through typed Supabase adapters. Generated database types are maintained in `src/types/database.ts`.

Local migration execution remains unavailable because Docker is not installed on this workstation. Run `pnpm supabase start`, `pnpm supabase db reset`, and `pnpm supabase test db` in an environment with Docker when local PostgreSQL parity is needed.
