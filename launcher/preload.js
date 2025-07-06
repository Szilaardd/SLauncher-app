const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Updater események
    onUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback),
    restartApp: () => ipcRenderer.send('restart-app'),

    // Alap IPC hívások, ha kell még más a későbbiekben
    sendMessage: (channel, data) => ipcRenderer.send(channel, data),
    onMessage: (channel, callback) => ipcRenderer.on(channel, callback),

    // Például egy egyszerű fájl megnyitás
    openFile: () => ipcRenderer.send('open-file'),

    downloadGame: (gameId) => ipcRenderer.send('download-game', gameId),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
    onDownloadCompleted: (callback) => ipcRenderer.on('download-completed', (event, gameId) => callback(gameId)),
    openGame: (gameId) => ipcRenderer.send('open-game', gameId),
});
