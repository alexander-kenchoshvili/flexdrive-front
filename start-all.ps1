# Start both shopback (Django) and shopfront (Nuxt) for development
# Run from: shopfront folder or parent folder containing both shopfront and shopback

$ErrorActionPreference = "Stop"

function Load-DotEnv {
  param([string]$Path)

  $values = @{}

  if (-not (Test-Path $Path)) {
    return $values
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()

    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) {
      return
    }

    $values[$parts[0].Trim()] = $parts[1].Trim()
  }

  return $values
}

# Paths - assumes shopback is sibling of shopfront (e.g. Desktop/shopfront, Desktop/shopback)
$scriptDir = $PSScriptRoot
$shopbackPath = (Resolve-Path (Join-Path $scriptDir "..\shopback")).Path
$shopfrontPath = $scriptDir
$frontendEnv = Load-DotEnv -Path (Join-Path $shopfrontPath ".env")
$backendEnv = Load-DotEnv -Path (Join-Path $shopbackPath ".env")

$frontendUrl = $frontendEnv["NUXT_PUBLIC_SITE_URL"]
if ([string]::IsNullOrWhiteSpace($frontendUrl)) {
  $frontendUrl = "https://localhost:3000"
}

$backendProtocol = "https"
if ($backendEnv["BACKEND_DEV_USE_HTTPS"] -and $backendEnv["BACKEND_DEV_USE_HTTPS"].Trim().ToLowerInvariant() -eq "false") {
  $backendProtocol = "http"
}

$backendHost = $backendEnv["BACKEND_DEV_HOST"]
if ([string]::IsNullOrWhiteSpace($backendHost)) {
  $backendHost = "localhost"
}

$backendPort = $backendEnv["BACKEND_DEV_PORT"]
if ([string]::IsNullOrWhiteSpace($backendPort)) {
  $backendPort = "8000"
}

$backendUrl = "${backendProtocol}://${backendHost}:$backendPort"

Write-Host "=== Starting shopback (Django) on $backendUrl ===" -ForegroundColor Cyan
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$shopbackPath'; .\start.ps1" -PassThru

Write-Host "Waiting 5 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "=== Starting shopfront (Nuxt) on $frontendUrl ===" -ForegroundColor Cyan
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$shopfrontPath'; npm run dev" -PassThru

Write-Host ""
Write-Host "Both servers started in separate windows." -ForegroundColor Green
Write-Host "  Backend:  $backendUrl" -ForegroundColor White
Write-Host "  Frontend: $frontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "Close the PowerShell windows to stop the servers." -ForegroundColor Gray
