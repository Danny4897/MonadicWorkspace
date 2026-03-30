const { contextBridge, ipcRenderer, shell } = require('electron')

contextBridge.exposeInMainWorld('monadicApp', {
  switchView: (index) => ipcRenderer.send('switch-view', index),
  openExternal: (url) => shell.openExternal(url),
})
