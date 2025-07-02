const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

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
        <button id="launchBtn" style="padding:8px 15px; margin-right: 10px;">Launch anyway</button>
        <button id="quitBtn" style="padding:8px 15px;">Quit</button>
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
    resizable: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.loadURL('https://szilaardd.github.io/SLauncher/');

  session.defaultSession.on('will-download', (event, item) => {
    const filePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(filePath);

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log(`✅ Letöltve: ${filePath}`);
        shell.openPath(filePath);
      } else {
        console.log(`❌ Letöltés megszakítva: ${state}`);
      }
    });
  });
}

app.whenReady().then(() => {
  createUpdateWindow();

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('checking-for-update', () => {
    console.log('Event: checking-for-update');
    if (updateWindow) updateWindow.webContents.send('update-status', 'Checking for updates...');
  });

  autoUpdater.on('update-available', () => {
    console.log('Event: update-available');
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update found. Downloading...');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.floor(progressObj.percent);
    console.log(`Event: download-progress - ${percent}%`);
    if (updateWindow) updateWindow.webContents.send('download-progress', percent);
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Event: update-not-available');
    if (updateWindow) updateWindow.webContents.send('update-status', 'No updates found.');
    setTimeout(() => {
      if (updateWindow) updateWindow.close();
      createMainWindow();
    }, 1500);
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Event: update-downloaded');
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update downloaded. Restarting...');
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 1500);
  });

  autoUpdater.on('error', (error) => {
    console.error('Event: error', error);
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update error. Launching app.');
    setTimeout(() => {
      if (updateWindow) updateWindow.close();
      createMainWindow();
    }, 2000);
  });
});

// IPC események a gombokhoz
ipcMain.on('launch-anyway', () => {
  if (updateWindow) updateWindow.close();
  createMainWindow();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// Játékellenőrzés és indítás (eredeti kód)
ipcMain.handle('check-game-installed', async () => {
  const gameExePath = path.join(
    'C:', 'Program Files (x86)', 'Spidey - Flies eater', 'Spidey - flies eater.exe'
  );
  return fs.existsSync(gameExePath);
});

ipcMain.on('open-game', () => {
  const userLocalAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const gameFolderName = 'fantasztikus_32m_225rk_243';
  const exeName = 'Fantasztikus Márkó.exe';

  const gameExePath = path.join(userLocalAppData, 'Programs', gameFolderName, exeName);

  console.log('🟢 open-game esemény érkezett!');
  console.log('🎮 Indítandó játék:', gameExePath);

  execFile(gameExePath, (error) => {
    if (error) {
      console.error('❌ Nem sikerült elindítani a játékot:', error);
    } else {
      console.log('✅ Játék elindítva');
    }
  });
});

ipcMain.on('open-game2', () => {
  const gameExePath = path.join(
    'C:', 'Program Files (x86)', 'Spidey - Flies eater', 'Spidey - flies eater.exe'
  );
  console.log('🟢 open-game2 esemény érkezett!');
  console.log('🎮 Indítandó játék:', gameExePath);

  execFile(gameExePath, (error) => {
    if (error) {
      console.error('❌ Nem sikerült elindítani a játékot:', error);
    } else {
      console.log('✅ Játék elindítva');
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
