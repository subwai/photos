import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import process from 'process';
import url from 'url';

export type Channels = string;

contextBridge.exposeInMainWorld('electron', {
  setRootFolder(path: string) {
    ipcRenderer.send('set-root-folder', path);
  },
  on(channel: Channels, listener: (...args: unknown[]) => void) {
    ipcRenderer.on(channel, (_: IpcRendererEvent, ...args: unknown[]) => listener(...(args || [])));
  },
  removeListener(channel: Channels, listener: (...args: unknown[]) => void) {
    ipcRenderer.removeListener(channel, listener);
  },
  send(channel: Channels, ...args: unknown[]) {
    ipcRenderer.send(channel, args);
  },
  invoke(channel: Channels, ...args: unknown[]) {
    return ipcRenderer.invoke(channel, ...(args || []));
  },
  platform: process.platform,
  pathToFileURL(path: string) {
    return url.pathToFileURL(path).toString();
  },
});
