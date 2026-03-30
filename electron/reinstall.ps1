# Aggiorna MonadicWorkspace (portable) — kill + copia nuovo exe
$ErrorActionPreference = "SilentlyContinue"

$destDir  = "$env:LOCALAPPDATA\MonadicWorkspace"
$destExe  = "$destDir\MonadicWorkspace.exe"
$shortcut = "$env:USERPROFILE\Desktop\MonadicWorkspace.lnk"
$newExe   = "$PSScriptRoot\dist\MonadicWorkspace.exe"

Write-Host "-> Chiudo tutti i processi..." -ForegroundColor Cyan
taskkill /F /IM "MonadicWorkspace.exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper.exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper (GPU).exe" /T 2>$null
taskkill /F /IM "MonadicWorkspace Helper (Renderer).exe" /T 2>$null
Start-Sleep -Seconds 2

if (-not (Test-Path $newExe)) {
    Write-Host "Exe non trovato: $newExe" -ForegroundColor Red
    Write-Host "Esegui prima: npm run build:win" -ForegroundColor Yellow
    exit 1
}

# Crea dir destinazione e copia exe
New-Item -ItemType Directory -Path $destDir -Force | Out-Null
Copy-Item $newExe $destExe -Force
Write-Host "-> Exe copiato in $destDir" -ForegroundColor Green

# Crea/aggiorna shortcut sul Desktop
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($shortcut)
$sc.TargetPath = $destExe
$sc.WorkingDirectory = $destDir
$sc.Description = "MonadicWorkspace"
$sc.Save()
Write-Host "-> Shortcut aggiornato sul Desktop." -ForegroundColor Green

# Avvia
Write-Host "-> Avvio MonadicWorkspace..." -ForegroundColor Cyan
Start-Process $destExe
Write-Host "Fatto." -ForegroundColor Green
