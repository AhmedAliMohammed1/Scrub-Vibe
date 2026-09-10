# Release and rollback runbook

## Release gate

1. Confirm the branch is current with `main` and the worktree is clean.
2. Run `pnpm install --frozen-lockfile`, lint, typecheck, tests and production build.
3. Review database migrations for RLS, grants, indexes, reversibility and compatibility with the currently deployed app.
4. Apply additive/backward-compatible migrations before promoting code that depends on them.
5. Verify the Vercel preview with critical English/Arabic, checkout and admin smoke journeys.
6. Confirm required environment variables, provider readiness and health endpoint results.
7. Promote the tested artifact or merge to `main`; record commit, deployment URL, operator and time.
8. Watch runtime errors, checkout failures, cron jobs and payment callbacks for at least 30 minutes.

## Application rollback

Use Vercel Instant Rollback to restore the last known-good deployment. Confirm the target commit and deployment before acting. A rollback changes application code but does not reverse Supabase migrations, Storage changes or cron definitions; Vercel cron schedules can remain unchanged after Instant Rollback and must be reviewed separately.

After rollback, check `/api/health/live`, `/api/health/ready`, authentication, catalogue, cart, checkout and admin orders. Confirm current code remains compatible with the live schema.

## Database rollback policy

Production migrations are forward-fixed by default. Do not run destructive down migrations during an incident. Add a corrective migration that preserves data, or restore to a confirmed backup only for a severity-1 data-loss/corruption event under the backup runbook.

## Emergency payment stop

- Set `PAYMOB_ENABLED=false` and redeploy to stop new Paymob intentions.
- Do not delete webhook audit events or manually mark Paymob payments paid.
- Keep Vodafone Cash/InstaPay proof review and COD available only if their operational queues are healthy.
- Reconcile provider transactions before re-enabling payment methods.
