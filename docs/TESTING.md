# Testing

Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` before release. Vitest covers domain logic, React regressions and migration-security invariants; live checkpoints also verify Supabase RLS/grants and selected browser journeys.

The Customer Reviews checkpoint passed 32 files and 319 tests, strict TypeScript, ESLint and the Next.js 16.3.3 build. The later stock-notification dialog has dedicated coverage. A committed Playwright suite is still required for repeatable critical end-to-end journeys.
