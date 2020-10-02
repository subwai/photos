import { find, findLast, includes } from 'lodash';
import path from 'path';
// eslint-disable-next-line import/no-cycle
import { HiddenFolders } from '../features/hiddenFoldersSlice';

export default interface FileEntry {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: FileEntry[] | null;
}

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.webp'];

export function isImage(fileEntry: FileEntry) {
  return !fileEntry.isFolder && includes(IMAGE_EXTENSIONS, path.extname(fileEntry.fullPath));
}

export function isVideo(fileEntry: FileEntry) {
  return !fileEntry.isFolder && includes(VIDEO_EXTENSIONS, path.extname(fileEntry.fullPath));
}

export function findFirstFolder(fileEntry: FileEntry) {
  return fileEntry.children && find(fileEntry.children, 'isFolder');
}

export function findLastFolder(fileEntry: FileEntry) {
  return fileEntry.children && findLast(fileEntry.children, 'isFolder');
}

export function findFirstImage(fileEntry: FileEntry) {
  return fileEntry.children && find(fileEntry.children, isImage);
}

export function findAllFilesRecursive(fileEntry: FileEntry, hiddenFolders: HiddenFolders, list: FileEntry[] = []) {
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
