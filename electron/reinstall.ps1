# Disinstalla e reinstalla MonadicWorkspace silenziosamente
$ErrorActionPreference = "SilentlyContinue"

Write-Host "-> Chiudo MonadicWorkspace..." -ForegroundColor Cyan
Stop-Process -Name "MonadicWorkspace" -Force

Write-Host "-> Disinstallazione versione precedente..." -ForegroundColor Cyan
$uninstaller = "$env:LOCALAPPDATA\Programs\MonadicWorkspace\Uninstall MonadicWorkspace.exe"
if (Test-Path $uninstaller) {
    Start-Process $uninstaller -ArgumentList "/S" -Wait
    Write-Host "   Disinstallato." -ForegroundColor Green
} else {
    Write-Host "   Nessuna installazione precedente trovata." -ForegroundColor Yellow
}

Write-Host "-> Installo nuova versione..." -ForegroundColor Cyan
$installer = "$PSScriptRoot\dist\MonadicWorkspace Setup 0.1.0.exe"
if (Test-Path $installer) {
    Start-Process $installer -Wait
    Write-Host "Installazione completata." -ForegroundColor Green
} else {
    Write-Host "Installer non trovato: $installer" -ForegroundColor Red
    Write-Host "Esegui prima: npm run build:win" -ForegroundColor Yellow
}
