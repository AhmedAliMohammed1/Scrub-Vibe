param(
  [Parameter(Mandatory = $true)]
  [string]$OutputRoot,
  [string]$ProjectRef = "iqufqtjotgpmhhtvlxwf"
)

$ErrorActionPreference = "Stop"
$databaseUrl = $env:SUPABASE_DB_URL
if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw "SUPABASE_DB_URL must contain the Session Pooler or direct database connection string."
}

$resolvedRoot = [IO.Path]::GetFullPath($OutputRoot)
if ($resolvedRoot -eq [IO.Path]::GetPathRoot($resolvedRoot)) {
  throw "Refusing to write a backup directly to a filesystem root."
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupDirectory = Join-Path $resolvedRoot "scrub-vibe-$ProjectRef-$timestamp"
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

$supabase = Join-Path (Resolve-Path ".").Path "node_modules\.bin\supabase.cmd"
if (-not (Test-Path -LiteralPath $supabase)) {
  throw "Supabase CLI was not found. Run pnpm install first."
}

& $supabase db dump --db-url $databaseUrl -f (Join-Path $backupDirectory "roles.sql") --role-only
if ($LASTEXITCODE -ne 0) { throw "Role backup failed." }
& $supabase db dump --db-url $databaseUrl -f (Join-Path $backupDirectory "schema.sql")
if ($LASTEXITCODE -ne 0) { throw "Schema backup failed." }
& $supabase db dump --db-url $databaseUrl -f (Join-Path $backupDirectory "data.sql") --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
if ($LASTEXITCODE -ne 0) { throw "Data backup failed." }

if ($env:NEXT_PUBLIC_SUPABASE_URL -and ($env:SUPABASE_SECRET_KEY -or $env:SUPABASE_SERVICE_ROLE_KEY)) {
  & node (Join-Path $PSScriptRoot "backup-storage.mjs") $backupDirectory
  if ($LASTEXITCODE -ne 0) { throw "Storage object backup failed." }
} else {
  Write-Warning "Storage objects were not backed up because the Supabase URL/server key is missing."
}

$files = Get-ChildItem -LiteralPath $backupDirectory -File -Recurse | ForEach-Object {
  [ordered]@{
    path = [IO.Path]::GetRelativePath($backupDirectory, $_.FullName).Replace("\", "/")
    bytes = $_.Length
    sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
  }
}
$manifest = [ordered]@{
  formatVersion = 1
  projectRef = $ProjectRef
  createdAt = (Get-Date).ToUniversalTime().ToString("o")
  includesStorage = Test-Path -LiteralPath (Join-Path $backupDirectory "storage")
  files = @($files)
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $backupDirectory "manifest.json") -Encoding utf8

& node (Join-Path $PSScriptRoot "verify-backup.mjs") $backupDirectory
if ($LASTEXITCODE -ne 0) { throw "Backup verification failed." }
Write-Host "Verified backup created at $backupDirectory"
