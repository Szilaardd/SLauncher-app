const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openGame: () => ipcRenderer.send('open-game'),
  openGame2: () => ipcRenderer.send('open-game2'),
  openGame3: () => ipcRenderer.send('open-game3'),
  checkGameInstalled: () => ipcRenderer.invoke('check-game-installed'),
  checkGame3Installed: () => ipcRenderer.invoke('check-game3-installed'),
  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', callback)
});
