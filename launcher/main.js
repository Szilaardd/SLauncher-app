const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let updateWindow;

function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    width: 400,
    height: 220,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  updateWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <body style="font-family:sans-serif;text-align:center;padding:20px;">
      <h3 id="status">Checking for updates...</h3>
      <progress id="progress" value="0" max="100" style="width: 100%; height: 20px;"></progress>
      <div id="buttons" style="margin-top:20px;">
        <button id="launchBtn" style="padding:9px 16px; margin-right: 10px;">Launch anyway</button>
        <button id="quitBtn" style="padding:9px 16px;">Quit</button>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        const status = document.getElementById('status');
        const progress = document.getElementById('progress');
        const buttons = document.getElementById('buttons');
        const launchBtn = document.getElementById('launchBtn');
        const quitBtn = document.getElementById('quitBtn');

        ipcRenderer.on('update-status', (event, message) => {
          status.innerText = message;
        });

        ipcRenderer.on('download-progress', (event, percent) => {
          progress.value = percent;
          if (percent > 0 && percent < 100) {
            buttons.style.display = 'none';
          }
        });

        launchBtn.addEventListener('click', () => {
          ipcRenderer.send('launch-anyway');
        });

        quitBtn.addEventListener('click', () => {
          ipcRenderer.send('quit-app');
        });
      </script>
    </body>
  `));

  updateWindow.once('ready-to-show', () => updateWindow.show());
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  });

  mainWindow.setMenu(null);

 mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));

  // DevTools bekapcsolása, ha kell
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createUpdateWindow();
  // Ha nem akarod updateWindow-ot használni, cseréld erre:
  // createMainWindow();

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('checking-for-update', () => {
    if (updateWindow) updateWindow.webContents.send('update-status', 'Checking for updates...');
  });

  autoUpdater.on('update-available', () => {
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update found. Downloading...');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.floor(progressObj.percent);
    if (updateWindow) updateWindow.webContents.send('download-progress', percent);
  });

  autoUpdater.on('update-not-available', () => {
    if (updateWindow) updateWindow.webContents.send('update-status', 'No updates found.');
    setTimeout(() => {
      if (updateWindow) updateWindow.close();
      createMainWindow();
    }, 1500);
  });

  autoUpdater.on('update-downloaded', () => {
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update downloaded. Restarting...');
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 1500);
  });

  autoUpdater.on('error', (error) => {
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update error. Launching app.');
    setTimeout(() => {
      if (updateWindow) updateWindow.close();
      createMainWindow();
    }, 2000);
  });
});

ipcMain.on('launch-anyway', () => {
  if (updateWindow) updateWindow.close();
  createMainWindow();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('download-game', (event, gameId) => {
  console.log('Download requested for:', gameId);
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    event.sender.send('download-progress', { gameId, progress });
    if (progress >= 100) {
      clearInterval(interval);
      event.sender.send('download-completed', gameId);
    }
  }, 300);
});

ipcMain.on('open-game', (event, gameId) => {
  console.log('Open game requested:', gameId);
  // TODO: Indítsd el a játékot itt
});
