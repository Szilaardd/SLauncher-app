// ─────────────────────────────────────────────────────────────
// main.js
// ─────────────────────────────────────────────────────────────

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { execFile } = require('child_process');
const { autoUpdater } = require('electron-updater');
const extract = require('node-7z');
const sevenZipPath = require('7zip-bin').path7za;

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
      contextIsolation: false,
    },
  });

  updateWindow.loadURL(
    'data:text/html;charset=utf-8,' +
      encodeURIComponent(`
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
  `)
  );
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'build', 'index.html'));
}

app.whenReady().then(() => {
  createUpdateWindow();
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('checking-for-update', () => {
    updateWindow?.webContents.send('update-status', 'Checking for updates...');
  });

  autoUpdater.on('update-available', () => {
    updateWindow?.webContents.send('update-status', 'Update found. Downloading...');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.floor(progressObj.percent);
    updateWindow?.webContents.send('download-progress', percent);
  });

  autoUpdater.on('update-not-available', () => {
    updateWindow?.webContents.send('update-status', 'No updates found.');
    setTimeout(() => {
      updateWindow?.close();
      createMainWindow();
    }, 1500);
  });

  autoUpdater.on('update-downloaded', () => {
    updateWindow?.webContents.send('update-status', 'Update downloaded. Restarting...');
    setTimeout(() => autoUpdater.quitAndInstall(), 1500);
  });

  autoUpdater.on('error', () => {
    updateWindow?.webContents.send('update-status', 'Update error. Launching app.');
    setTimeout(() => {
      updateWindow?.close();
      createMainWindow();
    }, 2000);
  });
});

ipcMain.on('launch-anyway', () => {
  updateWindow?.close();
  createMainWindow();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─────────────────────────────────────────────────────────────
// DOWNLOAD AND OPEN GAME LOGIC
// ─────────────────────────────────────────────────────────────

const DOWNLOADS_DIR = path.join(app.getPath('documents'), 'SLauncherGames');

const gameLinks = {
  fm: {
    url: 'https://github.com/Szilaardd/SLauncher/raw/refs/heads/main/games/fm/V1.2.1/Windows-Installer.exe',
    fileName: 'Windows-Installer.exe',
  },
  sfe: {
    url: 'https://github.com/Szilaardd/SLauncher/raw/refs/heads/main/games/sfe/V1.0/Installer.exe',
    fileName: 'Installer.exe',
  },
  jt: {
    url: 'https://github.com/Szilaardd/SLauncher/raw/refs/heads/main/games/jt/Jump%20Together-1_0_0-windows.exe',
    fileName: 'JumpTogether.exe',
  },
  ss: {
    parts: [
      'https://github.com/Szilaardd/SLauncher/releases/download/ss/SSInstallerV1.7z.001',
      'https://github.com/Szilaardd/SLauncher/releases/download/ss/SSInstallerV1.7z.002',
    ],
    outputFolder: 'Stranger_Sphere',
    finalExe: path.join(
      DOWNLOADS_DIR,
      'ss',
      'Stranger_Sphere',
      'Windows',
      'Stranger_Sphere',
      'Binaries',
      'Win64',
      'Stranger_Sphere.exe'
    ),
  },
};

ipcMain.on('download-game', async (event, gameId) => {
  const game = gameLinks[gameId];
  if (!game) return;

  const gameDir = path.join(DOWNLOADS_DIR, gameId);
  fs.mkdirSync(gameDir, { recursive: true });

  try {
    if (gameId === 'ss') {
      let downloaded = 0;
      for (let i = 0; i < game.parts.length; i++) {
        const partUrl = game.parts[i];
        const partPath = path.join(gameDir, `SSInstallerV1.7z.00${i + 1}`);
        await downloadFile(partUrl, partPath, (percent) => {
          const progress = Math.floor(((downloaded + percent / 100) / game.parts.length) * 100);
          event.sender.send('download-progress', { gameId, progress });
        });
        downloaded++;
      }

      const archivePath = path.join(gameDir, 'SSInstallerV1.7z.001');
      const output = path.join(gameDir, game.outputFolder);
      fs.mkdirSync(output, { recursive: true });

      await new Promise((resolve, reject) => {
        const stream = extract.extractFull(archivePath, output, {
          $bin: sevenZipPath,
        });
        stream.on('end', resolve);
        stream.on('error', (err) => {
          event.sender.send('download-error', `Extraction failed: ${err.message}`);
          reject(err);
        });
      });

      event.sender.send('download-completed', gameId);
    } else {
      const filePath = path.join(gameDir, game.fileName);
      await downloadFile(game.url, filePath, (percent) => {
        event.sender.send('download-progress', { gameId, progress: Math.floor(percent) });
      });

      execFile(filePath);
      event.sender.send('download-completed', gameId);
    }
  } catch (err) {
    event.sender.send('download-error', `Download failed: ${err.message}`);
  }
});

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        const total = parseInt(response.headers['content-length'], 10);
        let downloaded = 0;

        response.pipe(file);
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const percent = (downloaded / total) * 100;
          onProgress(percent);
        });

        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {
          reject(err);
        });
      });
  });
}
