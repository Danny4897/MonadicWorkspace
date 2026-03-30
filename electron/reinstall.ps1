# Disinstalla e reinstalla MonadicWorkspace silenziosamente
$ErrorActionPreference = "SilentlyContinue"

Write-Host "-> Chiudo tutti i processi MonadicWorkspace..." -ForegroundColor Cyan

# Kill processo principale e tutti i figli (inclusi node.exe backend)
taskkill /F /IM "MonadicWorkspace.exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper.exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper (GPU).exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper (Renderer).exe" /T 2>$null

# Aspetta che i processi siano effettivamente morti
$maxWait = 10
$waited = 0
while ((Get-Process -Name "MonadicWorkspace" -ErrorAction SilentlyContinue) -and $waited -lt $maxWait) {
    Start-Sleep -Milliseconds 500
    $waited += 0.5
}

Write-Host "-> Disinstallazione versione precedente..." -ForegroundColor Cyan
$uninstaller = "$env:LOCALAPPDATA\Programs\MonadicWorkspace\Uninstall MonadicWorkspace.exe"
if (Test-Path $uninstaller) {
    Start-Process $uninstaller -ArgumentList "/S" -Wait
    Start-Sleep -Seconds 2
    Write-Host "   Disinstallato." -ForegroundColor Green
} else {
    Write-Host "   Nessuna installazione precedente trovata." -ForegroundColor Yellow
}

Write-Host "-> Installo nuova versione..." -ForegroundColor Cyan
$installer = "$PSScriptRoot\dist\MonadicWorkspace Setup 0.1.0.exe"
if (Test-Path $installer) {
    # /S = silent install senza UI (funziona con oneClick=true)
    Start-Process $installer -ArgumentList "/S" -Wait
    Write-Host "Installazione completata." -ForegroundColor Green
} else {
    Write-Host "Installer non trovato: $installer" -ForegroundColor Red
    Write-Host "Esegui prima: npm run build:win" -ForegroundColor Yellow
}
