import { app, ipcMain, BrowserWindow, dialog } from 'electron';
import Bluebird from 'bluebird';
import fs, { BaseEncodingOptions } from 'fs';
import path from 'path';
import FileEntry, { isImageOrVideo } from '../renderer/models/FileEntry';

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

  readFileTreePromiseMap: { [key: string]: Bluebird<FileEntry> } = {};

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
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

    const fullPath = path.join(this.rootFolder, fileName);
    const rootLevel = this.rootFolder.split(/[\\/]/).length;

    try {
      const stats = await statAsync(fullPath);
      const level = fullPath.split(/[\\/]/).length - rootLevel;

      if (stats.isDirectory()) {
        this.mainWindow.webContents.send('file-changed', await this.getChildren(fullPath));
      } else if (isImageOrVideo(fullPath)) {
        this.mainWindow.webContents.send('file-changed', <FileEntry>{
          name: path.basename(fullPath),
          fullPath,
          isFolder: stats.isDirectory(),
          children: null,
          level,
        });
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.mainWindow.webContents.send('file-removed', fullPath);
      }
    }
  };

  getChildren = async (fullPath: string): Promise<FileEntry[]> => {
    const files = await readdirAsync(fullPath, { withFileTypes: true });
    const rootLevel = this.rootFolder?.split(/[\\/]/).length || 0;
    const level = fullPath.split(/[\\/]/).length - rootLevel + 1;

    console.log('Scanning', fullPath);

    return files.map((file) => ({
      name: file.name,
      fullPath: path.resolve(fullPath, file.name),
      isFolder: file.isDirectory(),
      children: null,
      level,
    }));
  };
}
