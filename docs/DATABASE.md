# Database

## Hosted project

- Project ref: `iqufqtjotgpmhhtvlxwf`
- PostgreSQL: 17.6
- Applied migrations: `foundation_identity_catalogue`, `optimize_inventory_select_policy`, `seed_initial_catalogue`
- Verification: 13/13 tables have RLS; security advisor clean; anonymous Data API reads return the seeded catalogue through the publishable key
- Seeded catalogue: 2 categories, 4 bilingual products, 15 active variants and 15 inventory rows

The target model is normalized around products → options → values → variants, with per-variant inventory and append-only movements. Orders snapshot product, variant, price and tax display data to remain historically accurate.

Every public-schema table must explicitly enable RLS. Grants and policies are treated as separate controls. Authorization roles live in server-controlled data/app metadata, never editable user metadata.

## Implemented foundation

The first CLI-generated migration creates normalized profile/RBAC, category, product translation, product image, option, option value, variant, inventory and append-only inventory movement tables. Foreign keys used for lookups are indexed, money uses integer minor units, and timestamps use `timestamptz`.

All 13 exposed tables enable RLS. Client grants are revoked globally and selectively restored. Public catalogue policies expose only active published products, while profile access is owner-scoped. Staff checks use a private, locked-down role lookup rather than editable user metadata.

The production storefront reads normalized catalogue rows through a typed server-only Supabase adapter. The initial seed resolves generated identities with `RETURNING` rather than hardcoding IDs and is safe to replay through its unique-key upserts.

Local migration execution remains unavailable because Docker is not installed on this workstation. Run `pnpm supabase start`, `pnpm supabase db reset`, and `pnpm supabase test db` in an environment with Docker when local PostgreSQL parity is needed.
