import Bluebird from 'bluebird';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { watch, FSWatcher, WatchListener } from 'fs';
import { readdir, stat } from 'fs/promises';
import { includes, some } from 'lodash';
import path from 'path';
import type FileEntryObject from 'renderer/models/FileEntry';
import type { Children, CoverEntryObject } from 'renderer/models/FileEntry';

export function getCachePath() {
  return path.join(app.getPath('userData'), 'app-cache');
}

export default class FileSystem {
  mainWindow: BrowserWindow;

  rootFolder?: string;

  watcher?: FSWatcher;

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
    ipcMain.handle('get-cover', (_: Electron.IpcMainInvokeEvent, fullPath: string) => this.getCover(fullPath));
    ipcMain.on('open-folder', this.openFolder);
    ipcMain.on('set-root-folder', (_: Electron.IpcMainInvokeEvent, fullPath: string) =>
      this.setRootFolderPath(fullPath),
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

    try {
      this.watcher = watch(this.rootFolder, { recursive: true }, this.handleFileWatchEvent);
    } catch (err) {
      this.rootFolder = undefined;
      console.error('Error starting watcher', err);
    }
  }

  handleFileWatchEvent: WatchListener<string> = async (eventType: string, fileName: string | null) => {
    if (!this.rootFolder || !fileName || FileSystem.inExcludes(fileName)) {
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
      const stats = await stat(fullPath);
      const level = fullPath.split(/[\\/]/).length - rootLevel;

      this.mainWindow.webContents.send('file-changed', {
        entry: <FileEntryObject>{
          // eslint-disable-next-line prettier/prettier
          name: path.basename(fullPath),
          fullPath,
          isFolder: stats.isDirectory(),
          children: stats.isDirectory() ? await this.getChildren(fullPath) : null,
          accessedTime: stats.atime,
          modifiedTime: stats.mtime,
          createdTime: stats.ctime,
          level,
        },
        eventType,
      });
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.mainWindow.webContents.send('file-removed', fullPath);
      }
    }
  };

  getChildren = async (fullPath: string): Promise<Children<FileEntryObject> | null> => {
    console.log('Scanning', fullPath);

    this.blackList.set(fullPath, new Date().valueOf() + 500);
    try {
      const files = await readdir(fullPath);
      const rootLevel = this.rootFolder?.split(/[\\/]/).length || 0;

      const level = fullPath.split(/[\\/]/).length - rootLevel + 1;
      const stats = await Bluebird.map(files, file => stat(path.resolve(fullPath, file)));

      const children: Children<FileEntryObject> = {};

      // eslint-disable-next-line
      for (const index in files) {
        const file = files[index];
        const fileStats = stats[index];

        if (FileSystem.inExcludes(file)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        children[file] = {
          name: file,
          fullPath: path.resolve(fullPath, file),
          isFolder: fileStats.isDirectory(),
          children: null,
          accessedTime: fileStats.atime,
          modifiedTime: fileStats.mtime,
          createdTime: fileStats.ctime,
          level,
        };
      }

      return children;
    } catch (err) {
      console.error('Error getting children', err);
      return null;
    }
  };

  getCover = async (fullPath: string): Promise<CoverEntryObject | null> => {
    console.log('Scanning cover', fullPath);

    this.blackList.set(fullPath, new Date().valueOf() + 500);
    try {
      const files = await readdir(fullPath);

      // eslint-disable-next-line
      for (const index in files) {
        const file = files[index];

        if (FileSystem.isImageOrVideo(file) && !FileSystem.inExcludes(file)) {
          return {
            name: file,
            fullPath: path.resolve(fullPath, file),
            isFolder: false
          };
        }
      }

      const firstFolder = await FileSystem.findFirstFolder(files, fullPath);
      if (firstFolder) {
        return await this.getCover(path.resolve(fullPath, firstFolder));
      }

      return null;
    } catch (err) {
      console.error('Error getting cover', err);
      return null;
    }
  };

  static findFirstFolder = async (files: string[], folderPath: string) => {
    // eslint-disable-next-line
    for (const file of files) {
      // eslint-disable-next-line
      const stats = await stat(path.resolve(folderPath, file));
      if (stats.isDirectory()) {
        return file;
      }
    }

    return null;
  }

  static inExcludes = (name: String) => {
    const exludes = [/\.DS_Store/i, /\.Thumbs.db/i, /desktop.ini/i];

    return some(exludes, (regex: RegExp) => name.match(regex));
  };

  static IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

  static VIDEO_EXTENSIONS = ['.mp4', '.webm', '.avi', '.wmv', '.flv', '.mov'];

  static isImageOrVideo(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();

    return includes(FileSystem.VIDEO_EXTENSIONS, ext) || includes(FileSystem.IMAGE_EXTENSIONS, ext);
  }
}
