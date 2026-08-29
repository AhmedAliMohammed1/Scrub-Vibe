# Implementation plan

## Dependency map

Foundation → database/auth → catalogue → storefront → customer/cart → checkout/payments → orders/admin → analytics/risk → production validation.

## Phases

1. **Foundation** — Next.js 16 App Router, strict TypeScript, Tailwind v4, shadcn conventions, Vitest, CI, localized shell.
2. **Database and auth** — Supabase schema, migrations, RLS, SSR authentication, app-metadata RBAC, security tests.
3. **Catalogue** — repository implementation, products/translations/options/variants/inventory, search and URL filters.
4. **Storefront** — CMS-backed home, listing, details, SEO, accessibility and responsive QA.
5. **Customer** — anonymous/server cart merge, wishlist, account, addresses and reviews.
6. **Checkout** — transactional stock reservation, shipping zones, promotion engine, guest checkout, COD and Paymob abstraction.
7. **Operations** — immutable order snapshots, fulfillment, returns/refunds and role-scoped admin.
8. **Analytics and risk** — first-party event pipeline, CTR/attribution, configurable risk signals, audit logs.
9. **Production** — Playwright, security/RLS suite, observability, deployment and operations runbooks.

Completed history is recorded in `TASKS.md`; do not rewrite it when extending the roadmap.
