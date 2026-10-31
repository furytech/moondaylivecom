<#
.SYNOPSIS
  Manual backup of the Moonday Live Supabase database (project ggrhuhwxbwrfbbcwcrmv).

.DESCRIPTION
  Dumps, into a dated folder OUTSIDE the repo (default C:\Backups\moonday\YYYY-MM-DD_HHMM):
    public.sql      the public schema: tables, functions, policies, grants AND data
    auth-data.sql   auth.users and auth.identities (data only)
    cron-jobs.sql   the pg_cron job definitions, as cron.schedule(...) statements
    manifest.json   what was dumped, sizes, SHA-256 hashes, tool versions (no secrets)

  The database password is asked for at run time (hidden prompt). It is held only in this process's environment
  while the dump runs, and is never written to a file, printed or passed on a command line.

  Needs PostgreSQL 17 client tools (pg_dump and psql). No Docker. See docs/backup.md.

.PARAMETER CopyTo
  Optional second location (a cloud-synced or external-drive folder). The finished dump folder is copied there
  and the copy is checked against the hashes.

.PARAMETER OutRoot
  Where dated folders are created. Default C:\Backups\moonday. Refused if it is inside this repo.

.PARAMETER PgBin
  Folder that contains pg_dump.exe and psql.exe, if they are not on PATH or in C:\Program Files\PostgreSQL\*\bin.

.PARAMETER CheckOnly
  Checks the tools, the folders and the plan, then stops. Asks for no password and makes no connection.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\backup-db.ps1 -CopyTo "D:\MoondayBackups"
#>
[CmdletBinding()]
param(
  [string]$CopyTo,
  [string]$OutRoot = "C:\Backups\moonday",
  [string]$PgBin,
  [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$ProjectRef = "ggrhuhwxbwrfbbcwcrmv"   # the live project. Never the legacy hzlpnmvboqhzthvjlves.
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Clear-ConnectionEnv {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:PGHOST, Env:PGPORT, Env:PGUSER, Env:PGDATABASE, Env:PGSSLMODE, Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue
}

function Fail([string]$message) {
  Clear-ConnectionEnv
  Write-Host ""
  Write-Host "BACKUP FAILED: $message" -ForegroundColor Red
  exit 1
}

function Test-Inside([string]$path, [string]$folder) {
  $p = [IO.Path]::GetFullPath($path).TrimEnd('\') + '\'
  $f = [IO.Path]::GetFullPath($folder).TrimEnd('\') + '\'
  return $p.StartsWith($f, [StringComparison]::OrdinalIgnoreCase)
}

# ── 1. Folders ───────────────────────────────────────────────────────────────
if (Test-Inside $OutRoot $RepoRoot) { Fail "OutRoot ($OutRoot) is inside the repo. Backups hold user data and must stay outside it." }
if ($CopyTo -and (Test-Inside $CopyTo $RepoRoot)) { Fail "CopyTo ($CopyTo) is inside the repo. Use a folder outside it." }
$Stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$OutDir = Join-Path $OutRoot $Stamp

# ── 2. PostgreSQL client tools ───────────────────────────────────────────────
function Find-PgTool([string]$name) {
  if ($PgBin) {
    $candidate = Join-Path $PgBin "$name.exe"
    if (Test-Path $candidate) { return $candidate }
    Fail "$name.exe not found in -PgBin '$PgBin'."
  }
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $found = Get-ChildItem "C:\Program Files\PostgreSQL\*\bin\$name.exe" -ErrorAction SilentlyContinue |
    Sort-Object { [int](($_.FullName -split '\\')[3]) } -Descending | Select-Object -First 1
  if ($found) { return $found.FullName }
  return $null
}

$pgDump = Find-PgTool "pg_dump"
$psql = Find-PgTool "psql"
if (-not $pgDump -or -not $psql) {
  Write-Host "PostgreSQL client tools (pg_dump, psql) were not found." -ForegroundColor Yellow
  Write-Host "Install version 17 (the database runs PostgreSQL 17), then run this script again:"
  Write-Host "    winget install PostgreSQL.PostgreSQL.17"
  Write-Host "(In the installer you may untick everything except 'Command Line Tools'.)"
  Write-Host "If they are installed somewhere else, pass -PgBin 'C:\path\to\PostgreSQL\17\bin'."
  exit 1
}
$pgDumpVersion = (& $pgDump --version).Trim()
$majorMatch = [regex]::Match($pgDumpVersion, '(\d+)\.\d+')
if (-not $majorMatch.Success -or [int]$majorMatch.Groups[1].Value -lt 17) {
  Fail "pg_dump is too old ($pgDumpVersion). The database is PostgreSQL 17; install the version 17 client tools."
}

# ── 3. Connection details (no password here) ────────────────────────────────
# The pooler (session mode) works over IPv4; the direct database host is IPv6 only.
$PgHost = "aws-0-us-east-1.pooler.supabase.com"
$PgPort = "5432"
$poolerFile = Join-Path $RepoRoot "supabase\.temp\pooler-url"
if (Test-Path $poolerFile) {
  $m = [regex]::Match((Get-Content $poolerFile -Raw), '@([^:/]+):(\d+)/')
  if ($m.Success) { $PgHost = $m.Groups[1].Value; $PgPort = $m.Groups[2].Value }
}
$PgUser = "postgres.$ProjectRef"

Write-Host "Moonday Live database backup"
Write-Host "  Project : $ProjectRef"
Write-Host "  Server  : ${PgHost}:$PgPort as $PgUser"
Write-Host "  Tools   : $pgDumpVersion"
Write-Host "  Output  : $OutDir"
if ($CopyTo) { Write-Host "  Copy to : $CopyTo" }

if ($CheckOnly) {
  Write-Host ""
  Write-Host "Check only: tools and folders look fine. No password asked, nothing connected, nothing written." -ForegroundColor Green
  exit 0
}

# ── 4. Password: hidden prompt, process environment only ─────────────────────
$secure = Read-Host "Database password for $PgUser (input is hidden)" -AsSecureString
if ($secure.Length -eq 0) { Fail "No password entered." }
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr); $secure.Dispose() }

$env:PGHOST = $PgHost
$env:PGPORT = $PgPort
$env:PGUSER = $PgUser
$env:PGDATABASE = "postgres"
$env:PGSSLMODE = "require"
$env:PGCONNECT_TIMEOUT = "20"

try {
  # Prove the password and connection before creating anything.
  $ping = & $psql --no-psqlrc -At -c "select 1" 2>&1
  if ($LASTEXITCODE -ne 0) { Fail "Could not connect. Check the database password (Supabase dashboard > Project Settings > Database) and your network. Detail: $($ping | Select-Object -First 1)" }

  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

  # ── 5. public schema: structure, policies, grants and data ────────────────
  Write-Host "Dumping the public schema ..."
  & $pgDump --schema=public --no-owner --quote-all-identifiers --file (Join-Path $OutDir "public.sql")
  if ($LASTEXITCODE -ne 0) { Fail "pg_dump of the public schema failed." }

  # ── 6. auth users and identities (data only) ──────────────────────────────
  Write-Host "Dumping auth.users and auth.identities ..."
  & $pgDump --data-only --no-owner --table=auth.users --table=auth.identities --file (Join-Path $OutDir "auth-data.sql")
  if ($LASTEXITCODE -ne 0) { Fail "pg_dump of the auth tables failed." }

  # ── 7. pg_cron job definitions ────────────────────────────────────────────
  Write-Host "Saving the cron job definitions ..."
  $cronFile = Join-Path $OutDir "cron-jobs.sql"
  $cronSql = @"
select '-- pg_cron jobs. Re-create with: psql -f cron-jobs.sql (run it only on a project that has pg_cron and pg_net enabled).';
select format(E'select cron.schedule(%L, %L, %L);%s', jobname, schedule, command,
              case when active then '' else format(E'\nupdate cron.job set active = false where jobname = %L;', jobname) end)
from cron.job where jobname is not null order by jobid;
"@
  $cronOut = & $psql --no-psqlrc -At -c $cronSql 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  Cron definitions could not be read (continuing without them): $($cronOut | Select-Object -First 1)" -ForegroundColor Yellow
  } else {
    [IO.File]::WriteAllText($cronFile, (($cronOut -join "`n") + "`n"), $Utf8NoBom)
  }
}
finally {
  Clear-ConnectionEnv
}

# ── 8. Check what was written ────────────────────────────────────────────────
foreach ($name in "public.sql", "auth-data.sql") {
  $tail = (Get-Content (Join-Path $OutDir $name) -Tail 5) -join "`n"
  if ($tail -notmatch "PostgreSQL database dump complete") { Fail "$name looks incomplete (no completion marker). Do not rely on this backup." }
}

$files = Get-ChildItem $OutDir -File | Where-Object { $_.Name -ne "manifest.json" }
$manifest = [ordered]@{
  project       = $ProjectRef
  created_local = (Get-Date).ToString("s")
  pg_dump       = $pgDumpVersion
  note          = "Contains personal data (auth.users). Keep private. Not included: Storage files, Edge Function secrets, Vault secrets."
  files         = @($files | ForEach-Object {
      [ordered]@{ name = $_.Name; bytes = $_.Length; sha256 = (Get-FileHash $_.FullName -Algorithm SHA256).Hash }
    })
}
[IO.File]::WriteAllText((Join-Path $OutDir "manifest.json"), ($manifest | ConvertTo-Json -Depth 5), $Utf8NoBom)

Write-Host ""
Write-Host "Backup written to $OutDir" -ForegroundColor Green
foreach ($f in $manifest.files) { Write-Host ("  {0,-16} {1,12:N0} bytes" -f $f.name, $f.bytes) }

# ── 9. Optional second copy ──────────────────────────────────────────────────
if ($CopyTo) {
  $dest = Join-Path $CopyTo $Stamp
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  Copy-Item -Path (Join-Path $OutDir "*") -Destination $dest -Force
  foreach ($f in $manifest.files) {
    $copied = Join-Path $dest $f.name
    if (-not (Test-Path $copied) -or (Get-FileHash $copied -Algorithm SHA256).Hash -ne $f.sha256) {
      Fail "The copy in $dest does not match (file $($f.name)). The original in $OutDir is fine."
    }
  }
  Write-Host "Second copy verified: $dest" -ForegroundColor Green
}

Write-Host ""
Write-Host "Reminder: this folder holds user data. Keep it private and never put it in the repo."
