const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const https = require('https');
const { execFile } = require('child_process');
// node-7z használata, telepítsd: npm install node-7z
const Seven = require('node-7z');

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

  // mainWindow.webContents.openDevTools();
}

// Letöltésekhez mappa
const downloadsDir = path.join(app.getPath('userData'), 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Játékfájlok URL-jei, állítsd be a valós linkeket
const gameFiles = {
  fm: ['https://example.com/fm.7z'],
  sfe: ['https://example.com/sfe.7z'],
  jt: ['https://example.com/jt.7z'],
  ss: [
    'https://example.com/ss.7z',
    'https://example.com/ss.001'
  ],
};

// IPC: játék letöltése
ipcMain.on('download-game', async (event, gameId) => {
  if (!gameFiles[gameId]) {
    event.sender.send('download-error', `Ismeretlen játék: ${gameId}`);
    return;
  }

  try {
    const files = gameFiles[gameId];
    const downloadedFiles = [];

    for (const fileUrl of files) {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(downloadsDir, fileName);
      await downloadFile(fileUrl, filePath, (percent) => {
        event.sender.send('download-progress', { gameId, progress: percent });
      });
      downloadedFiles.push(filePath);
    }

    if (gameId === 'ss') {
      const extractPath = path.join(downloadsDir, 'ss_extracted');
      if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);
      await extract7z(downloadedFiles[0], extractPath);
    }

    event.sender.send('download-completed', gameId);
  } catch (err) {
    event.sender.send('download-error', err.message);
  }
});

// IPC: játék indítása
ipcMain.on('open-game', (event, gameId) => {
  let exePath;

  if (gameId === 'ss') {
    exePath = path.join(downloadsDir, 'ss_extracted', 'setup.exe'); // módosítsd, ha más az exe neve
  } else {
    exePath = path.join(downloadsDir, `${gameId}.exe`); // feltételezett exe név
  }

  if (!fs.existsSync(exePath)) {
    event.sender.send('open-game-error', `Nem található az indító fájl: ${exePath}`);
    return;
  }

  execFile(exePath, (error) => {
    if (error) {
      event.sender.send('open-game-error', `Hiba a játék indításakor: ${error.message}`);
    }
  });
});

// Letöltést segítő függvény
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    let receivedBytes = 0;

    https.get(url, (response) => {
      const totalBytes = parseInt(response.headers['content-length'], 10);
      response.pipe(file);

      response.on('data', (chunk) => {
        receivedBytes += chunk.length;
        const percent = Math.round((receivedBytes / totalBytes) * 100);
        onProgress(percent);
      });

      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

// 7zip kicsomagolás
function extract7z(archivePath, outputPath) {
  return new Promise((resolve, reject) => {
    const myStream = Seven.extractFull(archivePath, outputPath, {
      $progress: true
    });

    myStream.on('end', resolve);
    myStream.on('error', reject);
  });
}

// app lifecycle, updater, ipcMain események...

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
