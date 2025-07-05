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

  // SS
  openGame4: () => ipcRenderer.send('open-game4'),
  checkSsInstalled: () => ipcRenderer.invoke('checkSsInstalled'),

  onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', callback)
});





const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openDiscordLink: () => ipcRenderer.send('open-discord-link'),
  openWebLink: () => ipcRenderer.send('open-web-link'),
  // ... a többi is, ha kell
});


