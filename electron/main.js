const { app, BrowserWindow, BrowserView, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')

// ── Configurazione ────────────────────────────────────────────
const IS_DEV = process.env.NODE_ENV === 'development'

const SERVICES = [
  {
    name: 'dashboard',
    backendPort: 3001,
    frontendPort: 5173,
    frontendUrl: IS_DEV ? 'http://localhost:5173' : null,
    backendEntry: 'dist/index.js',
    color: '#00ff88',
    label: 'Dashboard',
  },
  {
    name: 'planner',
    backendPort: 3002,
    frontendPort: 5174,
    frontendUrl: IS_DEV ? 'http://localhost:5174' : null,
    backendEntry: 'dist/index.js',
    color: '#f0b429',
    label: 'Planner',
  },
  {
    name: 'studio',
    backendPort: 3003,
    frontendPort: 5175,
    frontendUrl: IS_DEV ? 'http://localhost:5175' : null,
    backendEntry: 'dist/index.js',
    color: '#a78bfa',
    label: 'Studio',
  },
]

const childProcesses = []
let mainWindow = null
let splashWindow = null
let views = []
let activeTabIndex = 0

// ── Path helpers ──────────────────────────────────────────────
function getBackendPath(serviceName) {
  if (IS_DEV) {
    return path.join(__dirname, '..', 'apps', serviceName, 'backend')
  }
  return path.join(process.resourcesPath, 'backends', serviceName)
}

function getFrontendUrl(service) {
  if (IS_DEV) return service.frontendUrl
  // In produzione serve i file statici via file:// protocol
  const frontendPath = path.join(process.resourcesPath, 'frontends', service.name, 'index.html')
  return `file://${frontendPath}`
}

// ── Avvio backend ─────────────────────────────────────────────
function startBackend(service) {
  const backendPath = getBackendPath(service.name)
  const entryPoint = path.join(backendPath, service.backendEntry)

  console.log(`[${service.name}] Starting backend: ${entryPoint}`)

  const nodeModulesPath = path.join(backendPath, 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`[${service.name}] Installing dependencies...`)
    const npmInstall = spawn('npm', ['install', '--omit=dev'], {
      cwd: backendPath,
      shell: true,
      stdio: 'inherit',
    })
    npmInstall.on('close', () => startNodeProcess(service, entryPoint, backendPath))
    return
  }

  startNodeProcess(service, entryPoint, backendPath)
}

function startNodeProcess(service, entryPoint, cwd) {
  const child = spawn('node', [entryPoint], {
    cwd,
    shell: false,
    env: {
      ...process.env,
      PORT: String(service.backendPort),
      NODE_ENV: 'production',
    },
  })

  child.stdout.on('data', (d) => console.log(`[${service.name}]`, d.toString().trim()))
  child.stderr.on('data', (d) => console.error(`[${service.name}] ERR`, d.toString().trim()))
  child.on('exit', (code) => console.log(`[${service.name}] exited with code ${code}`))

  childProcesses.push(child)
}

// ── Health check ──────────────────────────────────────────────
function waitForBackend(port, retries = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const check = () => {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) resolve()
        else retry()
      })
      req.on('error', retry)
      req.end()
    }
    const retry = () => {
      attempts++
      if (attempts >= retries) return reject(new Error(`Backend :${port} non risponde dopo ${retries}s`))
      setTimeout(check, 1000)
    }
    check()
  })
}

// ── Splash screen ─────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: false },
  })
  splashWindow.loadFile(path.join(__dirname, 'splash.html'))
  splashWindow.center()
}

// ── Finestra principale ────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'MonadicWorkspace',
    backgroundColor: '#0d1117',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'splash.html'))

  // Crea una BrowserView per ogni servizio
  views = SERVICES.map((service) => {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })
    const url = getFrontendUrl(service)
    view.webContents.loadURL(url)
    return view
  })

  // Mostra dashboard di default
  mainWindow.setBrowserView(views[0])
  resizeActiveView()

  mainWindow.on('resize', resizeActiveView)

  // Cambio tab via IPC
  ipcMain.on('switch-tab', (_event, tabIndex) => {
    if (tabIndex < 0 || tabIndex >= views.length) return
    activeTabIndex = tabIndex
    mainWindow.setBrowserView(views[tabIndex])
    resizeActiveView()
  })

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function resizeActiveView() {
  if (!mainWindow) return
  const view = mainWindow.getBrowserView()
  if (!view) return
  const [width, height] = mainWindow.getContentSize()
  const TAB_BAR_HEIGHT = 48
  view.setBounds({ x: 0, y: TAB_BAR_HEIGHT, width, height: height - TAB_BAR_HEIGHT })
}

// ── Lifecycle ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  createSplash()

  // In dev mode i backend girano già — salta l'avvio
  if (!IS_DEV) {
    SERVICES.forEach(startBackend)
  }

  // Attendi che i backend siano pronti
  try {
    await Promise.all(SERVICES.map((s) => waitForBackend(s.backendPort)))
    console.log('All backends ready.')
  } catch (err) {
    console.error('Backend startup warning:', err.message)
    // Procedi comunque — l'utente vedrà un errore nel frontend
  }

  createMainWindow()
})

app.on('window-all-closed', () => {
  childProcesses.forEach((p) => { try { p.kill('SIGTERM') } catch (_) {} })
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  childProcesses.forEach((p) => { try { p.kill('SIGTERM') } catch (_) {} })
})
