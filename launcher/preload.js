// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Frissítések (ha használod valahol)
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
  restartApp: () => ipcRenderer.send('restart-app'),

  // Általános IPC kommunikáció
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, callback) => ipcRenderer.on(channel, callback),

  // Játék letöltés és indítás
  downloadGame: (gameId) => ipcRenderer.send('download-game', gameId),
  openGame: (gameId) => ipcRenderer.send('open-game', gameId),

  // Letöltési események
  onDownloadProgress: (callback) =>
    ipcRenderer.on('download-progress', (event, data) => callback(data)),

  onDownloadCompleted: (callback) =>
    ipcRenderer.on('download-completed', (event, gameId) => callback(gameId)),

  onDownloadError: (callback) =>
    ipcRenderer.on('download-error', (event, error) => callback(error)),

  // Játék megnyitás események
  onOpenGameError: (callback) =>
    ipcRenderer.on('open-game-error', (event, error) => callback(error)),
});
