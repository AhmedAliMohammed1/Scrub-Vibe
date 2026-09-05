# Architecture

Next.js App Router serves localized React Server Component pages. Reads go through domain repositories; trusted UI mutations will use Server Actions, while webhooks and external APIs use Route Handlers. Supabase PostgreSQL is the source of truth and all exposed tables require RLS plus least-privilege grants.

The present `DevelopmentCatalog` is an explicit no-credentials adapter. It preserves the production interface but is not a production data store.

Catalogue discovery is request-driven: the shop page parses a strict allow-list of URL search parameters, loads the RLS-filtered catalogue through the active repository, then applies a pure localized filter/sort pipeline. This keeps URLs shareable and the filter contract independently testable; database-side search can replace the pipeline when catalogue scale requires pagination without changing the page interface.

## Boundaries

- `src/app` — routing, metadata and composition
- `src/components` — presentation and interactive UI
- `src/features` — domain types and feature code
- `src/lib` — repositories, localization and shared policies
- `supabase/migrations` — reviewed schema history
- `tests` — unit, integration and later E2E suites
