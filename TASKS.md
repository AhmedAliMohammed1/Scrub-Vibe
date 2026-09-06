# Tasks

## Phase 0 — Discovery

- [x] **DONE** Inspect repository (empty greenfield). Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Inspect reference information architecture and storefront journey. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Define phased architecture and recovery state. Tests: PASS. Commit: foundation checkpoint.

## Phase 1 — Foundation

- [x] **DONE** Create Next.js 16 / TypeScript / Tailwind project structure. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Add design tokens, owned UI primitive and responsive bilingual shell. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Add initial storefront, catalogue contract and original asset. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Add Vitest and CI configuration. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Install dependencies and generate pnpm lockfile. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Pass lint, typecheck, unit tests and production build. Tests: PASS. Commit: foundation checkpoint.
- [x] **DONE** Browser QA at required breakpoints and RTL. Tests: PASS. Commit: foundation checkpoint.

## Phase 2 — Database/Auth

- [x] **DONE** Execute Supabase foundation migration and live RLS/grant/Data API tests. Tests: PASS. Project: `iqufqtjotgpmhhtvlxwf`.
- [x] **DONE** Implement normalized identity/catalogue/variant/inventory migration, grants and policies. Tests: PASS (static security invariants). Commit: pending Phase 2 checkpoint.
- [x] **DONE** Implement SSR auth and server-validated RBAC. Tests: PASS. Commit: pending Phase 2 checkpoint.
- [x] **DONE** Resolve the inventory multiple-permissive-policy advisor warning and generate live database types. Tests: PASS. Commit: pending follow-up checkpoint.

## Phase 3+

- [x] **DONE** Implement the production Supabase catalogue/inventory read repository and localized seed. Tests: PASS (live RLS + local browser).
- [x] **DONE** Implement localized URL-addressable catalogue search, richer filtering and sorting. Tests: PASS (26 total + local browser).
- [x] **DONE** Implement customer authentication UI against the existing SSR auth foundation. Tests: PASS (21 total + local browser).
- [x] **DONE** Rebrand the storefront and hosted catalogue to Scrub Vibe with sourced product photography, bilingual medical-apparel copy, 9 products and 53 size variants. Tests: PASS (27 total + production browser).
- [x] **DONE** Implement admin commerce/marketing dashboard and product management. Tests: PASS.
- [x] **DONE** Implement multi-colour products with exact colour/size inventory variants. Tests: PASS.
- [x] **DONE** Implement Egypt checkout, phone OTP, COD, Paymob, always-visible Vodafone Cash/InstaPay proof review, orders and shipment tracking. Tests: PASS (44 total + live transactional rollback test).
- [ ] **TODO** Configure production Twilio, Paymob and transfer-destination environment variables and run provider sandbox acceptance tests.
- [ ] **TODO** Implement database-backed cart/wishlist merge, shipping-zone rates, notifications, recovery automation and final production observability/risk validation.
