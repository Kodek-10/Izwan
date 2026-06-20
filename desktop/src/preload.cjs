const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('izwanDesktop', {
  platform: process.platform,
  openQuickSearch: () => ipcRenderer.invoke('desktop:open-quick-search'),
  showMainWindow: () => ipcRenderer.invoke('desktop:show-main-window'),
  startOllama: () => ipcRenderer.invoke('desktop:start-ollama')
});
