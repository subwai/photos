import Bluebird from 'bluebird';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs, { BaseEncodingOptions } from 'fs';
import { each } from 'lodash';
import path from 'path';
import FileEntryObject, { Children } from '../renderer/models/FileEntry';

const readdirAsync: (arg1: fs.PathLike, arg2: BaseEncodingOptions & { withFileTypes: true }) => Bluebird<fs.Dirent[]> =
  Bluebird.promisify(fs.readdir);

const statAsync: (arg1: fs.PathLike) => Bluebird<fs.Stats> = Bluebird.promisify(fs.stat);

export function getCachePath() {
  return path.join(app.getPath('cache'), 'org.adamlyren.Photos');
}

export default class FileSystem {
  mainWindow: BrowserWindow;

  rootFolder?: string;

  watcher?: fs.FSWatcher;

  readFileTreePromiseMap: { [key: string]: Bluebird<FileEntryObject> } = {};

  blackList: Map<string, number>;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.blackList = new Map();
    setInterval(() => this.cleanBlacklist(), 5000);
  }

  cleanBlacklist() {
    const now = new Date().valueOf();
    this.blackList.forEach((expiration, fullPath) => {
      if (expiration <= now) {
        this.blackList.delete(fullPath);
      }
    });
  }

  closeWatcher() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  start() {
    ipcMain.handle('get-cache-path', getCachePath);
    ipcMain.handle('get-children', (_: Electron.IpcMainInvokeEvent, fullPath: string) => this.getChildren(fullPath));
    ipcMain.on('open-folder', this.openFolder);
    ipcMain.on('set-root-folder', (_: Electron.IpcMainInvokeEvent, fullPath: string) =>
      this.setRootFolderPath(fullPath)
    );
  }

  openFolder = () => {
    dialog
      .showOpenDialog(this.mainWindow, {
        title: 'Select Folder',
        defaultPath: this.getRootFolderPath(),
        properties: ['openDirectory', 'treatPackageAsDirectory', 'dontAddToRecent'],
      })
      .then((result) => {
        const folderPath = result.filePaths.pop();
        if (folderPath) {
          this.setRootFolderPath(folderPath);
          this.mainWindow.webContents.send('current-folder-changed', folderPath);
        }

        return null;
      })
      .catch(console.error);
  };

  getRootFolderPath() {
    return this.rootFolder;
  }

  setRootFolderPath(folderPath: string) {
    this.rootFolder = folderPath;
    this.restartWatcher();
  }

  restartWatcher() {
    this.closeWatcher();
    this.startWatcher();
  }

  startWatcher() {
    if (!this.rootFolder) {
      return;
    }

    this.watcher = fs.watch(this.rootFolder, { recursive: true }, this.handleFileWatchEvent);
  }

  handleFileWatchEvent = async (eventType: string, fileName: string) => {
    if (!this.rootFolder) {
      return;
    }

    console.log(eventType, fileName);

    const fullPath = path.resolve(this.rootFolder, fileName);
    const rootLevel = this.rootFolder.split(/[\\/]/).length;

    const expiration = this.blackList.get(fullPath);
    if (expiration && expiration > new Date().valueOf()) {
      return;
    }

    try {
      const stats = await statAsync(fullPath);
      const level = fullPath.split(/[\\/]/).length - rootLevel;

      this.mainWindow.webContents.send('file-changed', {
        entry: <FileEntryObject>{
          name: path.basename(fullPath),
          fullPath,
          isFolder: stats.isDirectory(),
          children: stats.isDirectory() ? await this.getChildren(fullPath) : null,
          level,
        },
        eventType,
      });
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.mainWindow.webContents.send('file-removed', fullPath);
      }
    }
  };

  getChildren = async (fullPath: string): Promise<Children<FileEntryObject> | null> => {
    console.log('Scanning', fullPath);

    this.blackList.set(fullPath, new Date().valueOf() + 500);
    try {
      const files = await readdirAsync(fullPath, { withFileTypes: true });
      const rootLevel = this.rootFolder?.split(/[\\/]/).length || 0;

      const level = fullPath.split(/[\\/]/).length - rootLevel + 1;

      const children: Children<FileEntryObject> = {};
      each(files, (file) => {
        children[file.name] = {
          name: file.name,
          fullPath: path.resolve(fullPath, file.name),
          isFolder: file.isDirectory(),
          children: null,
          level,
        };
      });

      return children;
    } catch (err) {
      return null;
    }
  };
}
