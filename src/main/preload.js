const { contextBridge, ipcRenderer } = require('electron');
const process = require('process');
const url = require('url');

contextBridge.exposeInMainWorld('electron', {
  setRootFolder(path) {
    ipcRenderer.send('set-root-folder', path);
  },
  on(channel, listener) {
    ipcRenderer.on(channel, (event, ...args) => listener(...(args || [])));
  },
  removeListener(channel, listener) {
    ipcRenderer.removeListener(channel, listener);
  },
  send(channel, ...args) {
    ipcRenderer.send(channel, args);
  },
  invoke(channel, ...args) {
    return ipcRenderer.invoke(channel, ...(args || []));
  },
  platform: process.platform,
  pathToFileURL(path) {
    return url.pathToFileURL(path).toString();
  },
});
