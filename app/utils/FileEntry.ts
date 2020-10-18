import { find, findIndex, findLast, identity, includes } from 'lodash';
import path from 'path';
// eslint-disable-next-line import/no-cycle
import { FoldersHash } from '../features/folderVisibilitySlice';

export default interface FileEntry {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: FileEntry[] | null;
  level: number;
}

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.webp'];

export function isImage(fileEntry: FileEntry) {
  return !fileEntry.isFolder && includes(IMAGE_EXTENSIONS, path.extname(fileEntry.fullPath).toLowerCase());
}

export function isVideo(fileEntry: FileEntry) {
  return !fileEntry.isFolder && includes(VIDEO_EXTENSIONS, path.extname(fileEntry.fullPath).toLowerCase());
}

export function isImageOrVideo(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  return includes(VIDEO_EXTENSIONS, ext) || includes(IMAGE_EXTENSIONS, ext);
}

export function findFirstFolder(fileEntry: FileEntry) {
  return fileEntry.children && find(fileEntry.children, 'isFolder');
}

export function findLastFolder(fileEntry: FileEntry) {
  return fileEntry.children && findLast(fileEntry.children, 'isFolder');
}

export function findFirstImageOrVideo(fileEntry: FileEntry) {
  return fileEntry.children && find(fileEntry.children, (child) => isImage(child) || isVideo(child));
}

export function findAllFilesRecursive(fileEntry: FileEntry, hiddenFolders: FoldersHash, list: FileEntry[] = []) {
  if (fileEntry.children) {
    fileEntry.children.forEach((child) => {
      if (child.isFolder && !hiddenFolders[child.fullPath]) {
        findAllFilesRecursive(child, hiddenFolders, list);
      } else if (isImage(child) || isVideo(child)) {
        list.push(child);
      }
    });
  }

  return list;
}

export function findFolderAndIndex(
  rootFolder: FileEntry | null,
  filePath: string | null
): { folder: FileEntry | null; index: number | null } {
  if (!rootFolder || !filePath) {
    return { folder: null, index: null };
  }

  const levels = filePath.substr(rootFolder.fullPath.length).split('/').filter(identity);
  let folder: FileEntry | null = rootFolder;
  let index = null;

  while (levels.length && folder) {
    const level = levels.shift();
    if (levels.length) {
      folder = find(folder?.children || [], (child) => child.name === level) || null;
    } else {
      index = findIndex(folder?.children || [], (child) => child.name === level);
      if (index === -1) {
        index = null;
      }
    }
  }

  return { folder, index };
}
