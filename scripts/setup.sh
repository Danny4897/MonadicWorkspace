#!/usr/bin/env bash
set -e

echo "MonadicWorkspace — Setup"
echo ""

# 1. Inizializza submodules
echo "-> Inizializzazione submodules..."
git submodule update --init --recursive

# 2. Copia .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "-> Creato .env da .env.example"
  echo "   Aggiungi GITHUB_TOKEN in .env per dati reali"
else
  echo "-> .env gia' presente, skip"
fi

# 3. Install dipendenze Node
echo "-> Installazione dipendenze Node..."
npm run install:all

# 4. Verifica .NET
if command -v dotnet &> /dev/null; then
  echo "-> .NET SDK: $(dotnet --version) OK"
else
  echo "   .NET SDK non trovato - MonadicAgent CLI non disponibile"
fi

# 5. Verifica MonadicForge
if dotnet tool list -g | grep -qi "monadicforge"; then
  echo "-> MonadicForge: installato OK"
else
  echo "   MonadicForge non installato - esegui: dotnet tool install -g MonadicForge"
fi

echo ""
echo "Setup completo. Comandi disponibili:"
echo "   npm run dev           -> avvia Dashboard + Planner + Studio"
echo "   docker-compose up     -> avvia tutto via Docker"
echo "   npm run status        -> monadic status (richiede .NET)"
echo ""
