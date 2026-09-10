param(
  [Parameter(Mandatory = $true)] [string]$BackupDirectory,
  [Parameter(Mandatory = $true)] [string]$TargetDbUrl,
  [Parameter(Mandatory = $true)] [string]$TargetProjectRef,
  [Parameter(Mandatory = $true)] [string]$ConfirmTargetProjectRef
)

$ErrorActionPreference = "Stop"
$productionProjectRef = "iqufqtjotgpmhhtvlxwf"
if ($TargetProjectRef -eq $productionProjectRef) { throw "Restore drills are forbidden against the production project." }
if ($ConfirmTargetProjectRef -cne $TargetProjectRef) { throw "Target confirmation does not exactly match TargetProjectRef." }
$backupRoot = (Resolve-Path -LiteralPath $BackupDirectory).Path

& node (Join-Path $PSScriptRoot "verify-backup.mjs") $backupRoot
if ($LASTEXITCODE -ne 0) { throw "Backup verification failed; restore was not started." }
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) { throw "psql is required for the restore drill." }

& psql --single-transaction --variable ON_ERROR_STOP=1 --file (Join-Path $backupRoot "roles.sql") --file (Join-Path $backupRoot "schema.sql") --command "SET session_replication_role = replica" --file (Join-Path $backupRoot "data.sql") --dbname $TargetDbUrl
if ($LASTEXITCODE -ne 0) { throw "Restore drill failed." }

& psql --variable ON_ERROR_STOP=1 --tuples-only --command "select count(*) from public.products; select count(*) from public.orders;" --dbname $TargetDbUrl
if ($LASTEXITCODE -ne 0) { throw "Post-restore smoke queries failed." }
Write-Host "Restore drill completed on non-production project $TargetProjectRef. Continue with application/RLS smoke tests."
