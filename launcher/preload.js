const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openGame: () => ipcRenderer.send('open-game'),
  openGame2: () => ipcRenderer.send('open-game2')
});
