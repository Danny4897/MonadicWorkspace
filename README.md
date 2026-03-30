# MonadicWorkspace

> Sistema integrato di sviluppo, pianificazione e controllo per l'ecosistema MonadicSharp.

Questo repo è l'**orchestrator root** — contiene i 5 tool come git submodules
e un docker-compose unificato per avviare l'intero sistema con un comando.

## Repo inclusi

| Tool | Repo | Backend | Frontend | Descrizione |
|------|------|---------|----------|-------------|
| **MonadicDashboard** | [Danny4897/MonadicDashboard](https://github.com/Danny4897/MonadicDashboard) | `:3001` | `:5173` | Control plane — metriche NuGet, GitHub, Green Score in tempo reale |
| **MonadicPlanner** | [Danny4897/MonadicPlanner](https://github.com/Danny4897/MonadicPlanner) | `:3002` | `:5174` | Kanban board project-aware con drag-and-drop |
| **MonadicAgent CLI** | [Danny4897/MonadicAgent](https://github.com/Danny4897/MonadicAgent) | — | — | CLI .NET: status, release, sync-mcp, forge wrapper |
| **MonadicStudio** | [Danny4897/MonadicStudio](https://github.com/Danny4897/MonadicStudio) | `:3003` | `:5175` | IDE verticale Monaco + Railway Visualizer + Forge integrato |
| **SharedPackages** | [Danny4897/MonadicSharedPackages](https://github.com/Danny4897/MonadicSharedPackages) | — | — | `@monadic/shared-ui` e `@monadic/shared-types` |

## Quick Start — Docker (raccomandato)

```bash
git clone --recurse-submodules https://github.com/Danny4897/MonadicWorkspace
cd MonadicWorkspace
cp .env.example .env          # opzionale: aggiungi GITHUB_TOKEN
docker-compose up --build
```

| Servizio | URL |
|----------|-----|
| MonadicDashboard | http://localhost:5173 |
| MonadicPlanner | http://localhost:5174 |
| MonadicStudio | http://localhost:5175 |

## Quick Start — Locale

```bash
git clone --recurse-submodules https://github.com/Danny4897/MonadicWorkspace
cd MonadicWorkspace

# Windows
.\scripts\setup.ps1

# Linux / macOS
./scripts/setup.sh

# Avvia tutti i frontend in parallelo
npm run dev
```

## MonadicAgent CLI

```bash
cd apps/agent-cli
dotnet run -- status           # stato ecosistema
dotnet run -- plan             # prossimo step suggerito
dotnet run -- release MonadicSharp --dry-run
```

## Aggiornare i submodules

```bash
npm run submodule:update
# oppure
git submodule update --remote --merge
```

## Struttura

```
MonadicWorkspace/
├── apps/
│   ├── dashboard/     → MonadicDashboard (backend :3001, frontend :5173)
│   ├── planner/       → MonadicPlanner   (backend :3002, frontend :5174)
│   ├── agent-cli/     → MonadicAgent     (CLI .NET)
│   └── studio/        → MonadicStudio    (backend :3003, frontend :5175)
├── packages/
│   └── shared/        → MonadicSharedPackages (@monadic/shared-ui, shared-types)
├── scripts/
│   ├── setup.sh
│   └── setup.ps1
├── docker-compose.yml
├── package.json
└── .env.example
```

## Prerequisiti

| Tool | Versione | Obbligatorio |
|------|----------|--------------|
| Node.js | 18+ | ✅ |
| .NET SDK | 8.0 | ✅ (per MonadicAgent) |
| Docker Desktop | qualsiasi | ⬜ (solo per docker-compose) |
| MonadicForge | ultima | ⬜ (per green score reale in Studio) |

## Ecosistema MonadicSharp

- [MonadicSharp](https://github.com/Danny4897/MonadicSharp) — core ROP library
- [MonadicSharp.Framework](https://github.com/Danny4897/MonadicSharp.Framework) — meta-package
- [MonadicSharp.Azure](https://github.com/Danny4897/MonadicSharp.Azure) — integrazione Azure
- [MonadicLeaf](https://github.com/Danny4897/MonadicLeaf) — CLI Roslyn analyzer
- [monadic-sharp-mcp](https://github.com/Danny4897/monadic-sharp-mcp) — MCP server per Claude

## License

MIT © [Danny4897](https://github.com/Danny4897)
