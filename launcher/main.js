const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('path');
const os = require('os'); // ez eddig hiányzott
const { execFile } = require('child_process'); // játék indításához

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  win.setMenu(null);
  win.loadURL('https://szilaardd.github.io/SLauncher/');

  // Letöltések figyelése
  session.defaultSession.on('will-download', (event, item, webContents) => {
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

app.whenReady().then(createWindow);

// 🔧 Itt kezeljük az open-game parancsot a preload -> renderer kapcsolatból:  FM
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


// SFE INDÍTÓ


ipcMain.on('open-game2', () => {
  // A program teljes elérési útvonala
  const gameExePath = path.join(
    'C:', 'Program Files (x86)', 'Spidey - Flies eater', 'Spidey - flies eater.exe'
  );
  console.log('🟢 open-game esemeny erkezett!');
  console.log('🎮 Inditando jatek:', gameExePath);

  execFile(gameExePath, (error) => {
    if (error) {
      console.error('❌ Nem sikerult elinditani a jatekot:', error);
    } else {
      console.log('✅ Játék elindítva');
    }
  });
});
