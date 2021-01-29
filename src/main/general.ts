import { BrowserWindow, ipcMain } from 'electron';
import { IpcMainInvokeEvent } from 'electron/main';

ipcMain.handle('close', (e: IpcMainInvokeEvent) => {
  const window = getWindowFromEvent(e);
  if (!window) {
    return;
  }

  window.close();
});

ipcMain.handle('maximize', (e: IpcMainInvokeEvent) => {
  const window = getWindowFromEvent(e);
  if (!window) {
    return;
  }

  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.handle('minimize', (e: IpcMainInvokeEvent) => {
  const window = getWindowFromEvent(e);
  if (!window) {
    return;
  }

  window.minimize();
});

function getWindowFromEvent(e: IpcMainInvokeEvent) {
  if (!e.sender) {
    return null;
  }

  return BrowserWindow.fromWebContents(e.sender);
}
