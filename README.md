# Scrub Vibe Commerce

Bilingual, production-oriented medical apparel commerce platform for Scrub Vibe Egypt. It combines a responsive English/Arabic storefront with Supabase catalogue, inventory, authentication, checkout, orders, returns, reviews, marketing automation and role-scoped administration.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without Supabase credentials the public UI can use the typed development catalogue adapter; authentication and protected commerce operations require the configured hosted project. Never expose the Supabase secret/service-role key to the browser.

## Commands

- `pnpm lint` — ESLint with Next.js Core Web Vitals rules
- `pnpm typecheck` — strict TypeScript verification
- `pnpm test` — unit and integration tests
- `pnpm test:integration` — migration and security integration tests
- `pnpm build` — production build

See [PROJECT_STATE.md](PROJECT_STATE.md) for the current feature/remaining-work inventory, [TASKS.md](TASKS.md) for delivery history and [PAYMOB_ACTIVATION.md](PAYMOB_ACTIVATION.md) before enabling Paymob.
