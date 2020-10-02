import { app, ipcMain } from 'electron';
import Bluebird from 'bluebird';
import fs, { BaseEncodingOptions } from 'fs';
import path from 'path';
import { includes } from 'lodash';
import FileEntry, { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from '../FileEntry';

const readdirAsync: (
  arg1: fs.PathLike,
  arg2: BaseEncodingOptions & { withFileTypes: true }
) => Bluebird<fs.Dirent[]> = Bluebird.promisify(fs.readdir);

let currentFolder: string;

export function setRootFolderPath(folderPath: string) {
  currentFolder = folderPath;
}

export function getRootFolderPath() {
  return currentFolder;
}

export async function readDirectoryRecursively(
  basePath: string,
  currentPath = '',
  entry?: fs.Dirent
): Promise<FileEntry | null> {
  if (entry && !entry.isDirectory()) {
    const extname = path.extname(entry.name);

    return includes(IMAGE_EXTENSIONS, extname) || includes(VIDEO_EXTENSIONS, extname)
      ? Bluebird.resolve({
          name: entry.name,
          fullPath: path.join(basePath, currentPath),
          isFolder: false,
          children: null,
        })
      : null;
  }

  let children = <(FileEntry | null)[]>[];
  try {
    const entries = await readdirAsync(path.join(basePath, currentPath), {
      withFileTypes: true,
    });
    children = await Bluebird.all(
      entries.map((_entry) => readDirectoryRecursively(basePath, path.join(currentPath, _entry.name), _entry))
    );
  } catch (err) {
    console.error(err.message);
  }

  return {
    name: entry ? entry.name : basePath,
    fullPath: path.join(basePath, currentPath),
    isFolder: true,
    children: children.filter((child): child is FileEntry => child !== null),
  };
}

export function getCachePath() {
  return path.join(app.getPath('cache'), 'org.adamlyren.Photos');
}

let readFileTreePromise = Bluebird.resolve<FileEntry | null>(null);
ipcMain.handle('get-file-tree', async (_, rootPath) => {
  if (!rootPath) {
    return null;
  }

  if (readFileTreePromise) {
    readFileTreePromise.cancel();
  }

  setRootFolderPath(rootPath);
  readFileTreePromise = Bluebird.try(() => readDirectoryRecursively(rootPath));

  return readFileTreePromise;
});

ipcMain.handle('get-cache-path', () => {
  return getCachePath();
});
