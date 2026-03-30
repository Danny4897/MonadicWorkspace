const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('monadicApp', {
  switchTab: (index) => ipcRenderer.send('switch-tab', index),
})
