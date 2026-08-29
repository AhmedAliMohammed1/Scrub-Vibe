# Database

The target model is normalized around products → options → values → variants, with per-variant inventory and append-only movements. Orders snapshot product, variant, price and tax display data to remain historically accurate.

Every public-schema table must explicitly enable RLS. Grants and policies are treated as separate controls. Authorization roles live in server-controlled data/app metadata, never editable user metadata.

## Implemented foundation

The first CLI-generated migration creates normalized profile/RBAC, category, product translation, product image, option, option value, variant, inventory and append-only inventory movement tables. Foreign keys used for lookups are indexed, money uses integer minor units, and timestamps use `timestamptz`.

All 13 exposed tables enable RLS. Client grants are revoked globally and selectively restored. Public catalogue policies expose only active published products, while profile access is owner-scoped. Staff checks use a private, locked-down role lookup rather than editable user metadata.

Local migration execution is pending because Docker is unavailable on this workstation. Run `pnpm supabase start`, `pnpm supabase db reset`, and `pnpm supabase test db` in an environment with Docker before applying to a hosted project.
