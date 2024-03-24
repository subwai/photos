import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';
import process from 'process';
import url from 'url';

export type Channels = string;

const electronHandler = {
  setRootFolder(path: string | null) {
    ipcRenderer.send('set-root-folder', path);
  },
  on(channel: Channels, listener: (...args: any[]) => void) {
    ipcRenderer.on(channel, (_: IpcRendererEvent, ...args: any[]) => listener(...(args || [])));
  },
  removeListener(channel: Channels, listener: (...args: any[]) => void) {
    ipcRenderer.removeListener(channel, listener);
  },
  send(channel: Channels, ...args: any[]) {
    ipcRenderer.send(channel, args);
  },
  invoke(channel: Channels, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...(args || []));
  },
  platform: process.platform,
  pathToFileURL(path: string) {
    return url.pathToFileURL(path).toString().replace('file://', 'media://');
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
