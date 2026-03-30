Write-Host "MonadicWorkspace — Setup" -ForegroundColor Green

git submodule update --init --recursive
Write-Host "-> Submodules inizializzati" -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "-> Creato .env — aggiungi GITHUB_TOKEN" -ForegroundColor Yellow
}

npm run install:all
Write-Host "-> Dipendenze Node installate" -ForegroundColor Cyan

$dotnetVersion = dotnet --version 2>$null
if ($dotnetVersion) {
    Write-Host "-> .NET SDK: $dotnetVersion OK" -ForegroundColor Green
} else {
    Write-Host "   .NET SDK non trovato" -ForegroundColor Yellow
}

Write-Host "`nSetup completo!" -ForegroundColor Green
Write-Host "   npm run dev          -> avvia i frontend" -ForegroundColor White
Write-Host "   docker-compose up    -> avvia tutto via Docker" -ForegroundColor White
