const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { autoUpdater } = require('electron-updater');
const fs = require('fs'); // <-- fájlkezeléshez szükséges

let mainWindow;
let updateWindow;

function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    width: 400,
    height: 180,
    resizable: false,
    frame: false, // menü és keret eltüntetése
    alwaysOnTop: true, // opcionális, hogy mindig előtérben legyen
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  updateWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <body style="font-family:sans-serif;text-align:center;padding:20px;">
      <h3 id="status">Checking for updates...</h3>
      <progress id="progress" value="0" max="100" style="width: 100%; height: 20px;"></progress>
      <script>
        const { ipcRenderer } = require('electron');
        ipcRenderer.on('update-status', (event, message) => {
          document.getElementById('status').innerText = message;
        });
        ipcRenderer.on('download-progress', (event, percent) => {
          document.getElementById('progress').value = percent;
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
    console.error('❌ Frissítési hiba:', error);
    if (updateWindow) updateWindow.webContents.send('update-status', 'Update error. Launching app.');
    setTimeout(() => {
      if (updateWindow) updateWindow.close();
      createMainWindow();
    }, 2000);
  });
});

// ✅ Új IPC handler a játék meglétének ellenőrzésére
ipcMain.handle('check-game-installed', async () => {
  const gameExePath = path.join(
    'C:', 'Program Files (x86)', 'Spidey - Flies eater', 'Spidey - flies eater.exe'
  );
  return fs.existsSync(gameExePath); // true ha létezik, false ha nem
});

// Játék indítási események
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
