const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { ConfigStore } = require('./config-store');
const { DeepSeekService } = require('./deepseek-service');
const { createScheduler } = require('./scheduler');

const LOG_FILE = path.join(__dirname, '..', '..', 'startup.log');

const DEV_USER_DATA = path.join(__dirname, '..', '..', 'userData');
app.setPath(
  'userData',
  app.isPackaged ? path.join(path.dirname(app.getPath('exe')), 'userData') : DEV_USER_DATA,
);

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('use-angle', 'swiftshader');

function appendLog(message) {
  try {
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Logging must never crash the app.
  }
}

process.on('uncaughtException', (error) => {
  appendLog(`uncaughtException: ${error && error.stack ? error.stack : error}`);
});

process.on('unhandledRejection', (reason) => {
  appendLog(`unhandledRejection: ${reason && reason.stack ? reason.stack : reason}`);
});

let petWindow = null;
let settingsWindow = null;
let tray = null;
let quitting = false;
let configStore = null;
let deepseekService = null;
let scheduler = null;

const ICON_PATH = path.join(__dirname, '..', '..', 'assets', 'icons', 'pet-tray.png');

function sendBalanceState(payload) {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send('balance:updated', payload);
  }
}

function sendConfigState() {
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send('config:changed', configStore.toSafeConfig());
  }
}

async function refreshBalance({ silent = false } = {}) {
  const apiKey = configStore.getApiKey();
  if (!apiKey) {
    const state = { status: 'NO_API_KEY', balances: [], isAvailable: false, updatedAt: null, error: null };
    sendBalanceState(state);
    return state;
  }

  if (!silent) {
    sendBalanceState({ status: 'LOADING', balances: [], isAvailable: false, updatedAt: null, error: null });
  }

  const result = await deepseekService.getBalance(apiKey);
  if (result.ok) {
    const state = {
      status: 'SUCCESS',
      balances: result.balances,
      isAvailable: result.isAvailable,
      updatedAt: Date.now(),
      error: null,
    };
    sendBalanceState(state);
    return state;
  }

  const state = {
    status: 'ERROR',
    balances: [],
    isAvailable: false,
    updatedAt: null,
    error: result.error,
    errorMessage: result.message || null,
  };
  sendBalanceState(state);
  return state;
}

function openSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 480,
    height: 620,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'DeepSeek 桌宠设置',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  settingsWindow.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function togglePetWindow() {
  if (!petWindow) {
    return;
  }
  if (petWindow.isVisible()) {
    petWindow.hide();
  } else {
    petWindow.show();
    petWindow.focus();
  }
}

function buildContextMenu() {
  const safe = configStore.toSafeConfig();
  return Menu.buildFromTemplate([
    { label: '刷新余额', click: () => refreshBalance() },
    { label: '设置', click: openSettings },
    {
      label: '自动刷新',
      type: 'checkbox',
      checked: safe.autoRefresh,
      click: (item) => {
        configStore.update({ autoRefresh: item.checked });
        scheduler.restart();
        sendConfigState();
      },
    },
    { type: 'separator' },
    { label: '隐藏桌宠', click: () => petWindow && petWindow.hide() },
    { label: '退出', click: () => { quitting = true; app.quit(); } },
  ]);
}

function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH);
  tray = new Tray(icon);
  tray.setToolTip('DeepSeek 余额桌宠');
  tray.setContextMenu(buildContextMenu());
  tray.on('click', togglePetWindow);
}

function createPetWindow() {
  petWindow = new BrowserWindow({
    width: 320,
    height: 440,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  petWindow.setAlwaysOnTop(true, 'screen-saver');
  petWindow.loadFile(path.join(__dirname, '..', 'renderer', 'pet.html'));
  petWindow.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      petWindow.hide();
    }
  });
  petWindow.on('closed', () => {
    petWindow = null;
  });
  petWindow.webContents.on('did-finish-load', () => {
    sendConfigState();
    if (configStore.data.queryOnStart && configStore.getApiKey()) {
      refreshBalance();
    }
  });
  petWindow.webContents.on('console-message', (_event, level, message) => {
    appendLog(`renderer console ${level}: ${message}`);
  });
  petWindow.webContents.on('render-process-gone', (_event, details) => {
    appendLog(`renderer gone: ${JSON.stringify(details)}`);
  });
}

function registerIpc() {
  ipcMain.handle('config:get', () => configStore.toSafeConfig());
  ipcMain.handle('config:save', (_event, payload) => {
    configStore.update(payload || {});
    if (Object.prototype.hasOwnProperty.call(payload || {}, 'autostart')) {
      app.setLoginItemSettings({ openAtLogin: Boolean(payload.autostart) });
    }
    scheduler.restart();
    sendConfigState();
    if (configStore.getApiKey()) {
      refreshBalance();
    }
    return configStore.toSafeConfig();
  });
  ipcMain.handle('balance:get', () => refreshBalance());
  ipcMain.handle('balance:test', async (_event, apiKey) => {
    if (!apiKey || !String(apiKey).trim()) {
      return { ok: false, error: 'empty' };
    }
    return deepseekService.getBalance(String(apiKey).trim());
  });
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.on('pet:hide', () => petWindow && petWindow.hide());
  ipcMain.on('pet:quit', () => {
    quitting = true;
    app.quit();
  });
  ipcMain.on('pet:show-context-menu', () => {
    buildContextMenu().popup({ window: petWindow });
  });
  ipcMain.on('settings:open', openSettings);
}

app
  .whenReady()
  .then(() => {
    appendLog('app ready');
    configStore = new ConfigStore(path.join(app.getPath('userData'), 'config.json'));
    deepseekService = new DeepSeekService();
    scheduler = createScheduler({
      getConfig: () => configStore.data,
      onTick: () => refreshBalance({ silent: true }),
    });

    app.setLoginItemSettings({ openAtLogin: Boolean(configStore.data.autostart) });
    registerIpc();
    createPetWindow();
    createTray();
    scheduler.start();
    appendLog('windows and tray created');
  })
  .catch((error) => {
    appendLog(`ready error: ${error && error.stack ? error.stack : error}`);
  });

app.on('window-all-closed', () => {
  // Keep the tray alive so the pet can be restored later.
});

app.on('before-quit', () => {
  quitting = true;
});
