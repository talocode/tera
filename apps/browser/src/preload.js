const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teraBrowser', {
  buildTeraSearchUrl: (query) => ipcRenderer.invoke('buildTeraSearchUrl', query),
  openTera: () => ipcRenderer.invoke('openTera'),
  askTeraAboutPage: (title, url) => ipcRenderer.invoke('askTeraAboutPage', title, url),
  summarizeWithTera: (title, url) => ipcRenderer.invoke('summarizeWithTera', title, url),
  learnWithTera: (title, url) => ipcRenderer.invoke('learnWithTera', title, url),
  captureViewport: () => ipcRenderer.invoke('capture-viewport'),
  onShowVisualContext: (callback) => ipcRenderer.on('show-visual-context', callback),

  getCaptureHistory: () => ipcRenderer.invoke('capture:history'),
  addToCaptureHistory: (capture) => ipcRenderer.invoke('capture:save', capture),
  removeFromCaptureHistory: (id) => ipcRenderer.invoke('capture:remove', id),
  clearCaptureHistory: () => ipcRenderer.invoke('capture:clear'),
  getFullCapture: (id) => ipcRenderer.invoke('capture:get', id),
  getRecentCaptures: (limit) => ipcRenderer.invoke('capture:getRecent', limit),

  researchCapturePageText: () => ipcRenderer.invoke('research:capturePageText'),
  researchGetPageTitle: () => ipcRenderer.invoke('research:getPageTitle'),
  researchGetPageMeta: () => ipcRenderer.invoke('research:getPageMeta'),
  researchSendToTera: (payload) => ipcRenderer.invoke('research:sendToTera', payload),
  researchSummarizeWithTera: (payload) => ipcRenderer.invoke('research:summarizeWithTera', payload),
  researchOpenTeraSearch: (query) => ipcRenderer.invoke('research:openTeraSearch', query),
});
