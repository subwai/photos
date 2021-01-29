import { app, ipcMain } from 'electron';
import { BrowserWindow } from 'electron-acrylic-window';
import Bluebird from 'bluebird';
import fs, { BaseEncodingOptions } from 'fs';
import path from 'path';
import FileEntry, { isImageOrVideo } from '../renderer/models/FileEntry';

const readdirAsync: (
  arg1: fs.PathLike,
  arg2: BaseEncodingOptions & { withFileTypes: true }
) => Bluebird<fs.Dirent[]> = Bluebird.promisify(fs.readdir);

const statAsync: (arg1: fs.PathLike) => Bluebird<fs.Stats> = Bluebird.promisify(fs.stat);

type QueueEntry = [entry: FileEntry, parent: FileEntry | null];

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
    ipcMain.handle('get-file-tree', this.getFileTree);
  }

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

  handleFileWatchEvent = async (_: string, fileName: string) => {
    if (!this.rootFolder) {
      return;
    }

    console.log(_, fileName);

    const fullPath = path.join(this.rootFolder, fileName);
    const rootLevel = this.rootFolder.split(/[\\/]/).length;

    try {
      const stats = await statAsync(fullPath);
      if (stats.isDirectory()) {
        this.mainWindow.webContents.send('file-changed', await this.readFileTree(fullPath));
      } else if (isImageOrVideo(fullPath)) {
        this.mainWindow.webContents.send('file-changed', <FileEntry>{
          name: path.basename(fullPath),
          fullPath,
          isFolder: stats.isDirectory(),
          children: stats.isDirectory() ? [] : null,
          level: fullPath.split(/[\\/]/).length - rootLevel,
        });
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.mainWindow.webContents.send('file-removed', fullPath);
      }
    }
  };

  getFileTree = async (_: Electron.IpcMainInvokeEvent, rootPath: string) => {
    if (!rootPath) {
      return null;
    }

    this.setRootFolderPath(rootPath);

    return this.readFileTree(rootPath);
  };

  async readFileTree(rootPath: string) {
    if (this.readFileTreePromiseMap[rootPath]) {
      this.readFileTreePromiseMap[rootPath].cancel();
    }

    function filter(entry: FileEntry) {
      if (entry.isFolder) {
        return true;
      }

      return isImageOrVideo(entry.name);
    }

    this.readFileTreePromiseMap[rootPath] = Bluebird.try(() => FileSystem.recursiveReadDir(rootPath, filter));
    const result = await this.readFileTreePromiseMap[rootPath];
    delete this.readFileTreePromiseMap[rootPath];

    return result;
  }

  static async recursiveReadDir(
    dir: string,
    filter?: (entry: FileEntry) => boolean,
    concurrency = 100
  ): Promise<FileEntry> {
    const root = <FileEntry>{
      name: path.basename(dir),
      fullPath: dir,
      isFolder: true,
      children: [],
      level: 0,
    };

    const queue = <QueueEntry[]>[[root, null]];
    const visit = async (entry: FileEntry, parent: FileEntry | null) => {
      if (filter && !filter(entry)) return;
      if (entry.isFolder) {
        console.log(`Scanning ${entry.fullPath}`);
        queue.push(
          ...(await readdirAsync(entry.fullPath, { withFileTypes: true })).map<QueueEntry>((file) => [
            {
              name: file.name,
              fullPath: path.join(entry.fullPath, file.name),
              isFolder: file.isDirectory(),
              children: file.isDirectory() ? [] : null,
              level: entry.level + 1,
            },
            entry,
          ])
        );
      }

      if (parent && parent.children) {
        parent.children.push(entry);
      }
    };
    while (queue.length) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(queue.splice(0, concurrency).map(([entry, parent]) => visit(entry, parent)));
    }

    return root;
  }
}
