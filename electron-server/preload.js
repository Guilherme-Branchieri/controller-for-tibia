const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onServerInfo: (callback) => ipcRenderer.on('server-info', (_, data) => callback(data)),
  onConnectionStatus: (callback) => ipcRenderer.on('connection-status', (_, status) => callback(status))
});