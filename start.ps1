# ================================================
# (Re)Sources Relationnelles — Script de démarrage
# ================================================
# Lance :
#   - Docker : MySQL + Adminer + NGINX médias + Backend Symfony
#   - React  : Frontend (port 3002)
# ================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  (Re)Sources Relationnelles — Demarrage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Déterminer le dossier racine du projet
$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Definition }
if (-not $root) { $root = (Get-Location).Path }
$root = $root.TrimEnd('\')

Write-Host "  Dossier : $root" -ForegroundColor Gray
Write-Host ""

# Vérifier que Docker est lancé
$dockerRunning = docker info 2>&1 | Select-String "Server Version"
if (-not $dockerRunning) {
    Write-Host "  [ERREUR] Docker Desktop n'est pas lance !" -ForegroundColor Red
    Write-Host "  Lancez Docker Desktop et reessayez." -ForegroundColor Red
    Write-Host ""
    pause
    exit 1
}

# 1. Docker — MySQL
Write-Host "[1/4] Demarrage MySQL + Adminer..." -ForegroundColor Yellow
Set-Location "$root\mysql"
docker compose up -d 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "      MySQL    : localhost:3306" -ForegroundColor Green
    Write-Host "      Adminer  : http://localhost:8103" -ForegroundColor Green
} else {
    Write-Host "      [ERREUR] MySQL n'a pas demarre" -ForegroundColor Red
}

# 2. Docker — NGINX médias
Write-Host "[2/4] Demarrage NGINX medias..." -ForegroundColor Yellow
Set-Location "$root\nginx"
docker compose up -d 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "      Medias   : http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "      [ERREUR] NGINX n'a pas demarre" -ForegroundColor Red
}

# 3. Docker — Backend Symfony
Write-Host "[3/4] Demarrage Backend Symfony (Docker)..." -ForegroundColor Yellow
Set-Location "$root\backend"
docker compose up -d 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "      API      : http://localhost:8000/api" -ForegroundColor Green
} else {
    Write-Host "      [ERREUR] Backend n'a pas demarre" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# 4. React frontend
Write-Host "[4/4] Demarrage React (port 3002)..." -ForegroundColor Yellow
Set-Location $root
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; `$env:PORT=3002; npm start" -WindowStyle Normal
Write-Host "      Frontend : http://localhost:3002" -ForegroundColor Green

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tous les services sont demarres !" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend  : http://localhost:3002" -ForegroundColor White
Write-Host "  API       : http://localhost:8000/api" -ForegroundColor White
Write-Host "  Adminer   : http://localhost:8103" -ForegroundColor White
Write-Host "  Medias    : http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "  Pour arreter : .\stop.ps1" -ForegroundColor Gray
Write-Host ""
Set-Location $root
