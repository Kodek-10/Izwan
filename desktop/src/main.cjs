const { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const isDev = !app.isPackaged;
const backendPort = Number(process.env.IZWAN_BACKEND_PORT || 8000);
const frontendPort = Number(process.env.IZWAN_FRONTEND_PORT || 4173);
const backendUrl = `http://127.0.0.1:${backendPort}/api/v1`;
const frontendUrl = process.env.IZWAN_DESKTOP_FRONTEND_URL || `http://127.0.0.1:${frontendPort}`;

let mainWindow;
let tray;
let backendProcess;
let frontendProcess;
let ollamaProcess;

function resourcePath(...segments) {
  if (isDev) {
    return path.join(__dirname, '..', '..', ...segments);
  }

  return path.join(process.resourcesPath, ...segments);
}

function repoPath(...segments) {
  return path.join(__dirname, '..', '..', ...segments);
}

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(700, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

function spawnDetached(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: isDev ? 'inherit' : 'ignore',
    windowsHide: true,
    ...options,
    env: {
      ...process.env,
      ...options.env
    }
  });

  if (!isDev) {
    child.unref();
  }

  return child;
}

function getBackendExecutable() {
  const executable = process.platform === 'win32' ? 'izwan-backend.exe' : 'izwan-backend';
  const packaged = resourcePath('backend', executable);
  return fs.existsSync(packaged) ? packaged : null;
}

async function startBackend() {
  if (await isPortOpen(backendPort)) return;

  const databasePath = path.join(app.getPath('userData'), 'snippets.db');
  const corsOrigins = [
    `http://127.0.0.1:${frontendPort}`,
    `http://localhost:${frontendPort}`,
    frontendUrl
  ].join(',');
  const env = {
    DATABASE_URL: `sqlite:///${databasePath.replace(/\\/g, '/')}`,
    CORS_ORIGINS: corsOrigins,
    IZWAN_DESKTOP: '1'
  };

  const binary = getBackendExecutable();
  if (binary) {
    backendProcess = spawnDetached(binary, ['--host', '127.0.0.1', '--port', String(backendPort)], { env });
    await waitForPort(backendPort);
    return;
  }

  const backendDir = repoPath('backend');
  backendProcess = spawnDetached(
    process.platform === 'win32' ? 'python' : 'python3',
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(backendPort)],
    { cwd: backendDir, env }
  );
  await waitForPort(backendPort);
}

async function startFrontend() {
  if (process.env.IZWAN_DESKTOP_FRONTEND_URL || await isPortOpen(frontendPort)) return;

  if (isDev) {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    frontendProcess = spawnDetached(npmCommand, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort)], {
      cwd: repoPath('frontend'),
      env: {
        VITE_API_URL: backendUrl
      }
    });
    await waitForPort(frontendPort);
    return;
  }

  const serverPath = resourcePath('frontend', 'server', 'server.js');
  if (fs.existsSync(serverPath)) {
    frontendProcess = spawnDetached(process.execPath, [serverPath], {
      env: {
        ELECTRON_RUN_AS_NODE: '1',
        PORT: String(frontendPort),
        HOST: '127.0.0.1',
        VITE_API_URL: backendUrl
      }
    });
    await waitForPort(frontendPort);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [`--izwan-api-url=${backendUrl}`]
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.loadURL(frontendUrl);
}

function focusSearch() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.executeJavaScript(`
    (() => {
      const input = [...document.querySelectorAll('input, textarea')]
        .find((element) => /search|rechercher/i.test(element.placeholder || element.getAttribute('aria-label') || ''));
      if (input) {
        input.focus();
        input.select?.();
      }
    })();
  `).catch(() => {});
}

function getTrayImage() {
  const candidate = repoPath('vscode-extension', 'media', 'icon.svg');
  if (fs.existsSync(candidate)) {
    return nativeImage.createFromPath(candidate);
  }
  return nativeImage.createEmpty();
}

function createTray() {
  tray = new Tray(getTrayImage());
  tray.setToolTip('Izwan');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Ouvrir Izwan', click: () => mainWindow?.show() },
    { label: 'Recherche rapide', accelerator: 'Alt+Space', click: focusSearch },
    { label: 'Demarrer Ollama local', click: startOllama },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]));
  tray.on('click', () => mainWindow?.show());
}

function registerShortcuts() {
  globalShortcut.register('Alt+Space', focusSearch);
}

function findOllamaExecutable() {
  const executable = process.platform === 'win32' ? 'ollama.exe' : 'ollama';
  const bundled = resourcePath('ollama', executable);
  if (fs.existsSync(bundled)) return bundled;
  return executable;
}

function startOllama() {
  if (ollamaProcess) return { started: true, reused: true };

  ollamaProcess = spawnDetached(findOllamaExecutable(), ['serve'], {
    env: {
      OLLAMA_HOST: process.env.OLLAMA_HOST || '127.0.0.1:11434'
    }
  });
  return { started: true, reused: false };
}

ipcMain.handle('desktop:open-quick-search', () => {
  focusSearch();
  return true;
});
ipcMain.handle('desktop:show-main-window', () => {
  mainWindow?.show();
  return true;
});
ipcMain.handle('desktop:start-ollama', () => startOllama());

app.whenReady().then(async () => {
  await startBackend();
  await startFrontend();
  createWindow();
  createTray();
  registerShortcuts();

  if (process.env.IZWAN_DESKTOP_MANAGE_OLLAMA === '1') {
    startOllama();
  }
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  for (const child of [backendProcess, frontendProcess, ollamaProcess]) {
    if (child && !child.killed) child.kill();
  }
});
