import { app, ipcMain } from 'electron';
import Bluebird from 'bluebird';
import fs from 'fs';
import path from 'path';
import FileEntry from '../FileEntry';

const readdirAsync: (
  arg1: fs.PathLike,
  arg2: { encoding?: string | null | undefined; withFileTypes: true }
) => Bluebird<fs.Dirent[]> = Bluebird.promisify(fs.readdir);

let currentFolder: string;

export function setCurrentFolderPath(folderPath: string) {
  currentFolder = folderPath;
}

export function getCurrentFolderPath() {
  return currentFolder;
}

export async function readDirectoryRecursively(
  basePath: string,
  currentPath = '',
  entry?: fs.Dirent
): Promise<FileEntry> {
  if (entry && !entry.isDirectory()) {
    return Bluebird.resolve({
      name: entry.name,
      fullPath: path.join(basePath, currentPath),
      isFolder: false,
      children: null,
    });
  }

  const entries = await readdirAsync(path.join(basePath, currentPath), {
    withFileTypes: true,
  });
  const children = await Bluebird.all(
    entries.map((_entry) => readDirectoryRecursively(basePath, path.join(currentPath, _entry.name), _entry))
  );
  return {
    name: entry ? entry.name : basePath,
    fullPath: path.join(basePath, currentPath),
    isFolder: true,
    children,
  };
}

export function getCachePath() {
  return path.join(app.getPath('cache'), 'org.adamlyren.Photos');
}

ipcMain.handle('get-file-tree', async () => {
  if (!currentFolder) {
    return null;
  }

  return readDirectoryRecursively(currentFolder);
});

ipcMain.handle('get-cache-path', () => {
  return getCachePath();
});
