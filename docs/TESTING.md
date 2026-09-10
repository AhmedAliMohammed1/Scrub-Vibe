# Testing

Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` before release. Vitest covers domain logic, React regressions and migration-security invariants; live checkpoints also verify Supabase RLS/grants and selected browser journeys.

The Customer Reviews checkpoint passed 32 files and 319 tests, strict TypeScript, ESLint and the Next.js 16.3.3 build. The later stock-notification dialog has dedicated coverage. A committed Playwright suite is still required for repeatable critical end-to-end journeys.

Production-operations tests cover configuration defaults, constant-time bearer validation, fail-closed cron routes, liveness headers, restore-drill production protection and backup checksum/tamper detection. PowerShell and Node operation scripts are syntax-checked separately. The completed operations checkpoint passed 34 test files / 332 tests, lint, strict TypeScript and the production build.
