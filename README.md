# Scrub Vibe Commerce

Bilingual medical apparel storefront for Scrub Vibe Egypt. The app presents real scrub and lab-coat catalogue data through Supabase with responsive English and Arabic shopping flows.

## Quick start

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Without Supabase credentials the app intentionally uses the typed development catalogue adapter. Production data must be supplied through the Supabase repository implementation before launch.

## Commands

- `pnpm lint` — ESLint with Next.js Core Web Vitals rules
- `pnpm typecheck` — strict TypeScript verification
- `pnpm test` — unit tests
- `pnpm test:integration` — integration tests (added by phase)
- `pnpm build` — production build

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [PROJECT_STATE.md](PROJECT_STATE.md) before continuing.
