# Changelog

## Unreleased

- Initialized the NOVA Cairo production foundation.
- Added English/Arabic storefront routes with LTR/RTL layouts.
- Added original editorial hero art and responsive home, shop and product experiences.
- Added typed catalogue, cart/wishlist session interactions, money helpers, SEO routes, tests and CI.
- Verified responsive layouts at all required breakpoints and fixed the 768px merchandising overflow.
- Passed lint, strict type checking, unit tests and production build.
- Added a CLI-generated Supabase identity/catalogue/variant/inventory migration with least-privilege grants and RLS.
- Added Next.js 16 Proxy session refresh, Supabase browser/server clients and server-enforced RBAC guards.
- Updated pinned Supabase CLI, SSR and JavaScript clients to current stable releases.
- Applied and live-verified the Supabase foundation migration on the hosted production project.
- Added a follow-up migration that removes overlapping permissive inventory read policies.
- Generated TypeScript database types from the live Supabase schema.
- Added a typed server-only Supabase catalogue repository while preserving the development adapter for unconfigured environments.
- Seeded four bilingual products with normalized options, 15 variants and per-variant inventory in production.
- Verified the Supabase-backed home and product detail routes end to end with no fresh browser errors.
- Added bilingual customer sign-in, registration, sign-out, password recovery/update and authenticated account experiences.
- Added PKCE/OTP email confirmation handling with server-validated callback destinations and auth validation coverage.
