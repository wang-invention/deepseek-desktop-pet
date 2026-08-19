const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (payload) => ipcRenderer.invoke('config:save', payload),
  getBalance: (options) => ipcRenderer.invoke('balance:get', options),
  testBalance: (apiKey) => ipcRenderer.invoke('balance:test', apiKey),
  hidePet: () => ipcRenderer.send('pet:hide'),
  quitPet: () => ipcRenderer.send('pet:quit'),
  showContextMenu: () => ipcRenderer.send('pet:show-context-menu'),
  openSettings: () => ipcRenderer.send('settings:open'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  onBalanceUpdated: (callback) => {
    ipcRenderer.on('balance:updated', (_event, payload) => callback(payload));
  },
  onConfigChanged: (callback) => {
    ipcRenderer.on('config:changed', (_event, payload) => callback(payload));
  },
});
