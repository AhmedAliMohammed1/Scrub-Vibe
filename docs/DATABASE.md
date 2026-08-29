# Database

The target model is normalized around products → options → values → variants, with per-variant inventory and append-only movements. Orders snapshot product, variant, price and tax display data to remain historically accurate.

Every public-schema table must explicitly enable RLS. Grants and policies are treated as separate controls. Authorization roles live in server-controlled data/app metadata, never editable user metadata.
