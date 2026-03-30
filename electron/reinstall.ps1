# Aggiorna MonadicWorkspace — kill processi + elimina dir + reinstalla
$ErrorActionPreference = "SilentlyContinue"
$installDir = "$env:LOCALAPPDATA\Programs\MonadicWorkspace"

Write-Host "-> Chiudo tutti i processi..." -ForegroundColor Cyan
taskkill /F /IM "MonadicWorkspace.exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper.exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper (GPU).exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper (Renderer).exe" /T 2>$null
taskkill /F /IM "node.exe" /T 2>$null
Start-Sleep -Seconds 2

# Elimina la directory di installazione direttamente (bypassando l'uninstaller)
if (Test-Path $installDir) {
    Write-Host "-> Rimozione cartella installazione..." -ForegroundColor Cyan
    Remove-Item $installDir -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    if (Test-Path $installDir) {
        # Forza rimozione con robocopy (trucco: copia dir vuota sopra)
        $emptyDir = "$env:TEMP\empty_monadic"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        robocopy $emptyDir $installDir /MIR /NFL /NDL /NJH /NJS 2>$null
        Remove-Item $installDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   Cartella rimossa." -ForegroundColor Green
} else {
    Write-Host "   Nessuna installazione precedente." -ForegroundColor Yellow
}

# Pulisci registro (entry uninstall)
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\MonadicWorkspace" -Name * -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\MonadicWorkspace" -ErrorAction SilentlyContinue

Write-Host "-> Installo nuova versione..." -ForegroundColor Cyan
$installer = "$PSScriptRoot\dist\MonadicWorkspace Setup 0.1.0.exe"
if (Test-Path $installer) {
    Start-Process $installer -ArgumentList "/S" -Wait
    Write-Host "Installazione completata." -ForegroundColor Green
} else {
    Write-Host "Installer non trovato: $installer" -ForegroundColor Red
    Write-Host "Esegui prima: npm run build:win" -ForegroundColor Yellow
}
