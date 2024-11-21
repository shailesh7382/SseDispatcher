const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  notify: (message) => ipcRenderer.send('notify', message),
});

ipcRenderer.on('notification', (event, message) => {
  new Notification({ title: 'Notification', body: message }).show();
});