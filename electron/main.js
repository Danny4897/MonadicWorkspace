const { app, BrowserWindow, BrowserView, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const fs = require('fs')

const IS_DEV = process.env.NODE_ENV === 'development'

// Studio = indice 0 (default), poi Planner, Dashboard
const SERVICES = [
  {
    name: 'studio',
    backendPort: 3003,
    frontendPort: 5175,
    frontendUrl: IS_DEV ? 'http://localhost:5175' : null,
    backendEntry: 'dist/index.js',
  },
  {
    name: 'planner',
    backendPort: 3002,
    frontendPort: 5174,
    frontendUrl: IS_DEV ? 'http://localhost:5174' : null,
    backendEntry: 'dist/index.js',
  },
  {
    name: 'dashboard',
    backendPort: 3001,
    frontendPort: 5173,
    frontendUrl: IS_DEV ? 'http://localhost:5173' : null,
    backendEntry: 'dist/index.js',
  },
]

const childProcesses = []
let mainWindow = null
let splashWindow = null
let views = []

// ── Path helpers ──────────────────────────────────────────────
function getBackendPath(serviceName) {
  if (IS_DEV) return path.join(__dirname, '..', 'apps', serviceName, 'backend')
  return path.join(process.resourcesPath, 'backends', serviceName)
}

function getFrontendPath(service) {
  if (IS_DEV) return null
  return path.join(process.resourcesPath, 'frontends', service.name)
}

// ── Patch fetch/XHR/WebSocket per file:// protocol ───────────
function buildApiPatch(service) {
  const port = service.backendPort
  const wsPort = service.backendPort
  return `
(function() {
  var port = ${port};
  var wsPort = ${wsPort};

  // Patch fetch
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = 'http://localhost:' + port + input;
    } else if (input && typeof input === 'object' && input.url && input.url.startsWith('/')) {
      input = new Request('http://localhost:' + port + input.url, input);
    }
    return _fetch.call(this, input, init);
  };

  // Patch XMLHttpRequest (axios)
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, async, user, pass) {
    if (typeof url === 'string' && url.startsWith('/')) {
      url = 'http://localhost:' + port + url;
    }
    return _open.call(this, method, url, async, user, pass);
  };

  // Patch WebSocket (studio)
  var _WS = window.WebSocket;
  window.WebSocket = function(url, protocols) {
    if (!url || url === 'ws://' || url === 'wss://' || url.endsWith('://')) {
      url = 'ws://localhost:' + wsPort;
    } else if (typeof url === 'string' && url.startsWith('/')) {
      url = 'ws://localhost:' + wsPort + url;
    }
    return protocols ? new _WS(url, protocols) : new _WS(url);
  };
  window.WebSocket.prototype = _WS.prototype;
  window.WebSocket.CONNECTING = _WS.CONNECTING;
  window.WebSocket.OPEN = _WS.OPEN;
  window.WebSocket.CLOSING = _WS.CLOSING;
  window.WebSocket.CLOSED = _WS.CLOSED;
})();
`
}

// ── Avvio backend ─────────────────────────────────────────────
function startBackend(service) {
  const backendPath = getBackendPath(service.name)
  const entryPoint = path.join(backendPath, service.backendEntry)
  const nodeModulesPath = path.join(backendPath, 'node_modules')
  const distExists = fs.existsSync(entryPoint)

  if (!fs.existsSync(nodeModulesPath)) {
    const npmInstall = spawn('npm', ['install', '--omit=dev'], { cwd: backendPath, shell: true, stdio: 'inherit' })
    npmInstall.on('close', (code) => {
      if (code !== 0) return console.error(`[${service.name}] npm install failed`)
      if (!distExists) compileThenStart(service, entryPoint, backendPath)
      else startNodeProcess(service, entryPoint, backendPath)
    })
    return
  }

  if (!distExists) { compileThenStart(service, entryPoint, backendPath); return }
  startNodeProcess(service, entryPoint, backendPath)
}

function compileThenStart(service, entryPoint, backendPath) {
  const tsc = spawn('npx', ['tsc', '--skipLibCheck'], { cwd: backendPath, shell: true, stdio: 'inherit' })
  tsc.on('close', (code) => {
    if (code !== 0) return console.error(`[${service.name}] TypeScript compilation failed`)
    startNodeProcess(service, entryPoint, backendPath)
  })
}

function startNodeProcess(service, entryPoint, cwd) {
  const child = spawn('node', [entryPoint], {
    cwd,
    shell: false,
    env: { ...process.env, PORT: String(service.backendPort), NODE_ENV: 'production' },
  })
  child.stdout.on('data', (d) => console.log(`[${service.name}]`, d.toString().trim()))
  child.stderr.on('data', (d) => console.error(`[${service.name}] ERR`, d.toString().trim()))
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
      if (attempts >= retries) return reject(new Error(`Backend :${port} non risponde`))
      setTimeout(check, 1000)
    }
    check()
  })
}

// ── Splash standalone ─────────────────────────────────────────
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

// ── Finestra principale VSCode-style ──────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'MonadicWorkspace',
    backgroundColor: '#1e1e1e',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'shell.html'))

  // Crea BrowserView per ogni servizio con patch API iniettata
  views = SERVICES.map((service) => {
    const view = new BrowserView({
      webPreferences: { nodeIntegration: false, contextIsolation: false },
    })

    // Inietta patch PRIMA che React faccia chiamate API
    view.webContents.on('did-finish-load', () => {
      view.webContents.executeJavaScript(buildApiPatch(service)).catch(console.error)
    })

    const frontendPath = getFrontendPath(service)
    if (IS_DEV) {
      view.webContents.loadURL(service.frontendUrl)
    } else {
      view.webContents.loadFile(path.join(frontendPath, 'index.html'))
    }

    return view
  })

  // Studio (indice 0) di default
  mainWindow.setBrowserView(views[0])
  resizeActiveView()
  mainWindow.on('resize', resizeActiveView)

  ipcMain.on('switch-view', (_event, index) => {
    if (index < 0 || index >= views.length) return
    mainWindow.setBrowserView(views[index])
    resizeActiveView()
  })

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) { splashWindow.close(); splashWindow = null }
    mainWindow.show()
    mainWindow.maximize()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function resizeActiveView() {
  if (!mainWindow) return
  const view = mainWindow.getBrowserView()
  if (!view) return
  const [width, height] = mainWindow.getContentSize()
  const SIDEBAR_WIDTH = 48
  view.setBounds({ x: SIDEBAR_WIDTH, y: 0, width: width - SIDEBAR_WIDTH, height })
}

// ── Lifecycle ─────────────────────────────────────────────────
app.whenReady().then(async () => {
  createSplash()

  if (!IS_DEV) SERVICES.forEach(startBackend)

  try {
    await Promise.all(SERVICES.map((s) => waitForBackend(s.backendPort)))
    console.log('All backends ready.')
  } catch (err) {
    console.error('Backend startup warning:', err.message)
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
