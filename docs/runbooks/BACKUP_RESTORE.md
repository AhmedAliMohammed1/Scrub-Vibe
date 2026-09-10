# Backup and restore runbook

## Scope

Supabase database backups do not contain Storage object bytes; database and Storage backups must both succeed. Keep backups encrypted outside the repository and restrict access to the smallest operator group.

## Create a verified logical backup

1. Install project dependencies and PostgreSQL client tools.
2. Obtain the Session Pooler connection string from Supabase **Connect** and set it only in the current shell as `SUPABASE_DB_URL`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and a server-only `SUPABASE_SECRET_KEY` so private Storage objects are included.
4. Choose an encrypted output directory outside the repository.
5. Run:

```powershell
./scripts/operations/backup-supabase.ps1 -OutputRoot "D:\EncryptedBackups\ScrubVibe"
```

The command writes roles, schema, data and Storage objects, creates SHA-256 checksums, and refuses success unless verification passes. Never commit the output.

## Retention

- Keep 7 daily, 4 weekly and 12 monthly verified logical backups.
- Maintain at least one encrypted copy in a separate provider/account.
- Record backup timestamp, operator, manifest hash, size and verification result—never the database URL or secret.
- Paid Supabase plans provide managed daily backups; consider PITR when the required RPO is below 24 hours.

## Restore drill

Restore drills are prohibited against `iqufqtjotgpmhhtvlxwf`. Create a disposable non-production Supabase project in the same region, obtain its connection string, and run:

```powershell
./scripts/operations/restore-drill.ps1 `
  -BackupDirectory "D:\EncryptedBackups\ScrubVibe\scrub-vibe-..." `
  -TargetDbUrl $env:RESTORE_TARGET_DB_URL `
  -TargetProjectRef "non-production-ref" `
  -ConfirmTargetProjectRef "non-production-ref"
```

Then set the three `RESTORE_TARGET_SUPABASE_*` variables and restore Storage only after creating matching buckets/policies:

```powershell
node ./scripts/operations/restore-storage.mjs "D:\EncryptedBackups\ScrubVibe\scrub-vibe-..." "non-production-ref"
```

Validate migrations, RLS/grants, Auth configuration, bucket privacy, catalogue counts, a test sign-in, checkout rollback, admin access and signed proof download links. Record measured RPO/RTO and destroy the drill project after evidence is retained.

## Production restoration

A production restore is a declared severity-1 incident. Freeze deployments and checkout, preserve logs, identify the last known-good point, and use Supabase Dashboard managed restore/PITR with a second operator confirming the target timestamp. Expect database downtime. Storage is separate: restore missing object bytes from the encrypted Storage backup, then verify metadata/object parity.

After restoration, rotate exposed credentials if compromise is suspected, reapply provider webhooks/settings, verify auth redirects, run smoke tests, reconcile orders/payments created near the recovery point and document any lost transactions.

## References

- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
