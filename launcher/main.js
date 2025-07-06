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

  const isDev = !app.isPackaged;

  if (isDev) {
    autoUpdater.allowPrerelease = true;
    autoUpdater.checkForUpdates();
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }

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
        mainWindow.webContents.send('download-completed');
      } else {
        console.log(`❌ Letöltés megszakítva: ${state}`);
      }
    });
  });
}

app.whenReady().then(() => {
  createUpdateWindow();

  if (!app.isPackaged) {
    autoUpdater.allowPrerelease = true;
    autoUpdater.checkForUpdates();
  } else {
    autoUpdater.checkForUpdatesAndNotify();
  }

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

ipcMain.on('open-discord-link', () => {
  shell.openExternal('https://discord.gg/yFqjS2Hufe');
});

ipcMain.on('open-web-link', () => {
  shell.openExternal('https://szilaardd.github.io/SLauncher/download.html');
});

// IPC események a frissítő ablak gombjaihoz
ipcMain.on('launch-anyway', () => {
  if (updateWindow) updateWindow.close();
  createMainWindow();
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// --- Játék telepítettség ellenőrzése és indítása ---

// Fantasztikus Márkó
ipcMain.handle('checkFmInstalled', async () => {
  const userLocalAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const gameFolderName = 'fantasztikus_32m_225rk_243';
  const exeName = 'Fantasztikus Márkó.exe';
  const gameExePath = path.join(userLocalAppData, 'Programs', gameFolderName, exeName);
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

// Spidey - Flies eater
ipcMain.handle('checkSfeInstalled', async () => {
  const gameExePath = path.join('C:', 'Program Files (x86)', 'Spidey - Flies eater', 'Spidey - flies eater.exe');
  return fs.existsSync(gameExePath);
});
ipcMain.on('open-game2', () => {
  const gameExePath = path.join('C:', 'Program Files (x86)', 'Spidey - Flies eater', 'Spidey - flies eater.exe');

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

// Jump Together
ipcMain.handle('checkJtInstalled', async () => {
  const userLocalAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const gameFolderName = 'jump_32together';
  const exeName = 'Jump Together.exe';
  const gameExePath = path.join(userLocalAppData, 'Programs', gameFolderName, exeName);
  return fs.existsSync(gameExePath);
});
ipcMain.on('open-game3', () => {
  const userLocalAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const gameFolderName = 'jump_32together';
  const exeName = 'Jump Together.exe';
  const gameExePath = path.join(userLocalAppData, 'Programs', gameFolderName, exeName);

  console.log('🟢 open-game3 esemény érkezett!');
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


const RPC = require('discord-rpc');
const clientId = '1389953618647584798'; // Itt add meg a Discord alkalmazásod Client ID-ját

RPC.register(clientId);

const rpc = new RPC.Client({ transport: 'ipc' });

rpc.on('ready', () => {
  rpc.setActivity({
    details: 'SLauncher',
    state: 'Szilard games',
    buttons: [
    {
      label: 'Join Discord',
      url: 'https://discord.com/invite/yFqjS2Hufe'
    },
    {
      label: 'Download',
      url: 'https://szilaardd.github.io/SLauncher/download.html'
    }
  ],
startTimestamp: new Date(),
  instance: false,
  });

  console.log('Discord Rich Presence is now active!');
});

rpc.login({ clientId }).catch(console.error);


const SevenBin = require('7zip-bin');
const { execFile } = require('child_process');

const sevenZipPath = SevenBin.path7za;

execFile(sevenZipPath, ['x', 'SSInstallerV1.7z', '-oC:\\path\\to\\extract', '-y'], (err, stdout, stderr) => {
  if (err) {
    console.error('Extract error:', err);
  } else {
    console.log('Extract done');
  }
});



/* Stranger Sphere */

ipcMain.handle('checkSsInstalled', async () => {
  const gameExePath = path.join('C:', 'Program Files', 'Stranger Sphere', 'Windows', 'Stranger_Sphere', 'Binaries', 'Win64', 'Stranger_Sphere.exe');
  return fs.existsSync(gameExePath);
});

ipcMain.on('open-game4', () => {
  const gameExePath = path.join('C:', 'Program Files', 'Stranger Sphere', 'Windows', 'Stranger_Sphere', 'Binaries', 'Win64', 'Stranger_Sphere.exe');

  console.log('🟢 open-game4 esemény érkezett!');
  console.log('🎮 Indítandó játék:', gameExePath);

  execFile(gameExePath, (error) => {
    if (error) {
      console.error('❌ Nem sikerült elindítani a játékot:', error);
    } else {
      console.log('✅ Játék elindítva');
    }
  });
});


const https = require('https');

// Letöltendő fájlok és célnevek
const ssDownloadFolder = path.join(app.getPath('userData'), 'downloads');
const ssFiles = [
  {
    url: 'https://github.com/Szilaardd/SLauncher/releases/download/game/SSInstallerV1.7z.001',
    filename: 'SSInstallerV1.7z'
  },
  {
    url: 'https://github.com/Szilaardd/SLauncher/releases/download/game/SSInstallerV1.7z.002',
    filename: 'SSInstallerV1.7z.002'
  }
];

// Letöltés segédfüggvény
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });

    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}', status code: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

// Kibontás 7zip-pel (7za.exe kell vagy elérhető a PATH-ban)
function extractArchive(archivePath, extractTo) {
  return new Promise((resolve, reject) => {
    const sevenZipPath = '7za.exe'; // Ha nincs PATH-ban, add meg abszolút elérési útját
    execFile(sevenZipPath, ['x', archivePath, `-o${extractTo}`, '-y'], (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Telepítő futtatása
function runSetup(setupPath) {
  return new Promise((resolve, reject) => {
    execFile(setupPath, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// IPC esemény: indítja a letöltést, kibontást és telepítőt
ipcMain.handle('download-and-install-ss', async () => {
  try {
    if (!fs.existsSync(ssDownloadFolder)) fs.mkdirSync(ssDownloadFolder, { recursive: true });

    // Letöltés
    for (const file of ssFiles) {
      const dest = path.join(ssDownloadFolder, file.filename);
      console.log(`Downloading ${file.url} to ${dest}`);
      await downloadFile(file.url, dest);
    }

    // Kibontás az első fájlból (a 7z automatikusan kezeli a .002 részt is)
    const archivePath = path.join(ssDownloadFolder, 'SSInstallerV1.7z');
    console.log('Extracting archive...');
    await extractArchive(archivePath, ssDownloadFolder);

    // Telepítő futtatása
    const setupExePath = path.join(ssDownloadFolder, 'StrangerSphereSetup.exe');
    if (fs.existsSync(setupExePath)) {
      console.log('Running setup...');
      await runSetup(setupExePath);
      console.log('Setup finished.');
      return { success: true };
    } else {
      const msg = 'Setup exe not found: ' + setupExePath;
      console.error(msg);
      return { success: false, error: msg };
    }
  } catch (err) {
    console.error('Error during download and install:', err);
    return { success: false, error: err.message };
  }
});
