const { app, BrowserWindow, Menu, Tray, globalShortcut, nativeImage, shell } = require('electron');
const fs = require('fs');
const path = require('path');

// V2 : le desktop est une coquille native qui charge l'application web hébergée.
// Le backend (Render) et le frontend (Cloudflare Pages) ne sont plus lancés localement.
const APP_URL = process.env.IZWAN_DESKTOP_URL || 'https://izwan.pages.dev';

let mainWindow;
let tray;

function assetPath(name) {
  const p = path.join(__dirname, '..', 'build', name);
  return fs.existsSync(p) ? p : undefined;
}

function createWindow() {
  const icon = assetPath('icon.png');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#0e1a2e',
    icon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Fermer = masquer (l'app reste dans la barre système), sauf quit explicite.
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Les liens hors application s'ouvrent dans le navigateur système.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(APP_URL);
}

function showWindow() {
  if (!mainWindow) return createWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

// Alt+Space : afficher la fenêtre et donner le focus au champ de recherche.
function quickSearch() {
  showWindow();
  mainWindow.webContents
    .executeJavaScript(`
      (() => {
        const el = [...document.querySelectorAll('input, textarea')]
          .find((e) => /search|rechercher/i.test(e.placeholder || e.getAttribute('aria-label') || ''));
        if (el) { el.focus(); el.select?.(); }
      })();
    `)
    .catch(() => {});
}

function createTray() {
  const trayImg = assetPath('tray.png') || assetPath('icon.png');
  tray = new Tray(trayImg ? nativeImage.createFromPath(trayImg) : nativeImage.createEmpty());
  tray.setToolTip('Izwan');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Ouvrir Izwan', click: showWindow },
      { label: 'Recherche rapide', accelerator: 'Alt+Space', click: quickSearch },
      { type: 'separator' },
      { label: 'Quitter', click: () => { app.isQuitting = true; app.quit(); } },
    ]),
  );
  tray.on('click', showWindow);
}

// Une seule instance : une 2e ouverture refocalise la fenêtre existante.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(() => {
    createWindow();
    createTray();
    globalShortcut.register('Alt+Space', quickSearch);
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
});
