# Project state

- **Current phase:** Phase 2 — Database and authentication
- **Current task:** Execute the Supabase migration and RLS tests against a local or hosted project
- **Last successful task:** Phase 2 schema/RLS and SSR/RBAC implementation passed static security, unit, type and build verification
- **Current branch:** `main`
- **Latest relevant commit:** current checkpoint (see `git log -1` for the immutable hash)
- **Implemented:** Phase 1 storefront foundation; pinned Supabase CLI 2.116.0, SSR 0.12.5 and JS 2.112.4; CLI-generated normalized identity/catalogue/variant/inventory migration; least-privilege grants and RLS on all 13 public tables; private RBAC helper; auth-user profile/customer-role trigger; Next.js 16 Proxy session refresh; browser/server clients; server-validated role guards; migration security integration tests.
- **Remaining:** Supabase production repository, migration/RLS/auth/RBAC, transactional commerce, admin, payments, analytics, risk, full test pyramid and deployment.
- **Known bugs:** none confirmed in the implemented scope. The migration has not run against PostgreSQL yet.
- **Blocked tasks:** local Supabase migration/RLS execution requires Docker (not installed) or a connected hosted Supabase project. Paymob, Resend and Vercel validation require credentials/connections.
- **Required inputs:** final brand name/logo if NOVA is temporary; Supabase URL/publishable/secret keys; Paymob credentials; Resend key/sender domain; shipping-zone prices; production domain.
- **Latest tests:** PASS — 4 files, 9 tests (unit plus static migration security)
- **Latest build:** PASS — Next.js 16.3.3 production build
- **Latest deployment:** NOT_DEPLOYED
- **Exact next action:** provide/connect a Supabase project or install/start Docker; run migration reset, pgTAP/RLS verification and database advisors before beginning the production catalogue repository.

## Latest visual QA

PASS at 375, 390, 768, 1024 and 1440 widths. English LTR and Arabic RTL render without horizontal overflow, framework overlays or clean-browser console errors. Quick add updates the cart and product navigation resolves correctly.

## Resume protocol

Read this file, `TASKS.md`, `IMPLEMENTATION_PLAN.md`, `DECISIONS.md`, `TEST_REPORT.md`, then inspect `git status` and `git log` before changing code.
