'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  onUpdateAvailable: (cb) =>
    ipcRenderer.on('update-available', cb),

  onUpdateDownloaded: (cb) =>
    ipcRenderer.on('update-downloaded', cb),

  installUpdate: () =>
    ipcRenderer.invoke('install-update'),

  platform: process.platform,
});
