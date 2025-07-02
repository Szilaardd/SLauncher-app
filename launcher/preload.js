const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Fantasztikus Márkó
  openGame: () => ipcRenderer.send('open-game'),
  checkFmInstalled: () => ipcRenderer.invoke('checkFmInstalled'),

  // Spidey - Flies eater
  openGame2: () => ipcRenderer.send('open-game2'),
  checkSfeInstalled: () => ipcRenderer.invoke('checkSfeInstalled'),

  // Jump Together
  openGame3: () => ipcRenderer.send('open-game3'),
  checkJtInstalled: () => ipcRenderer.invoke('checkJtInstalled'),

  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', callback)
});
