# ================================================
# (Re)Sources Relationnelles — Script d'arret
# ================================================

Write-Host ""
Write-Host "  Arret de tous les services..." -ForegroundColor Red
Write-Host ""

$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Definition }
if (-not $root) { $root = (Get-Location).Path }
$root = $root.TrimEnd('\')

# Arrêt Backend Docker
Write-Host "  [1/3] Arret Backend..." -ForegroundColor Yellow
Set-Location "$root\backend"
docker compose down 2>&1 | Out-Null

# Arrêt NGINX
Write-Host "  [2/3] Arret NGINX..." -ForegroundColor Yellow
Set-Location "$root\nginx"
docker compose down 2>&1 | Out-Null

# Arrêt MySQL
Write-Host "  [3/3] Arret MySQL..." -ForegroundColor Yellow
Set-Location "$root\mysql"
docker compose down 2>&1 | Out-Null

# Arrêt des processus Node (React frontend)
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "  Tous les services sont arretes." -ForegroundColor Green
Write-Host ""
Set-Location $root
