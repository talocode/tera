const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teraBrowser', {
  buildTeraSearchUrl: (query) => ipcRenderer.invoke('buildTeraSearchUrl', query),
  openTera: () => ipcRenderer.invoke('openTera'),
  askTeraAboutPage: (title, url) => ipcRenderer.invoke('askTeraAboutPage', title, url),
  summarizeWithTera: (title, url) => ipcRenderer.invoke('summarizeWithTera', title, url),
  learnWithTera: (title, url) => ipcRenderer.invoke('learnWithTera', title, url),
  captureViewport: () => ipcRenderer.invoke('capture-viewport'),
  onShowVisualContext: (callback) => ipcRenderer.on('show-visual-context', callback),
});
