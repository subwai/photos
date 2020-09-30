import _ from 'lodash';
import path from 'path';

export default interface FileEntry {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: FileEntry[] | null;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.webp'];

export function isImage(fileEntry: FileEntry) {
  return !fileEntry.isFolder && _.includes(IMAGE_EXTENSIONS, path.extname(fileEntry.fullPath));
}

export function isVideo(fileEntry: FileEntry) {
  return !fileEntry.isFolder && _.includes(VIDEO_EXTENSIONS, path.extname(fileEntry.fullPath));
}

export function findFirstFolder(fileEntry: FileEntry) {
  return fileEntry.children && _.find(fileEntry.children, 'isFolder');
}

export function findLastFolder(fileEntry: FileEntry) {
  return fileEntry.children && _.findLast(fileEntry.children, 'isFolder');
}

export function findFirstImage(fileEntry: FileEntry) {
  return fileEntry.children && _.find(fileEntry.children, isImage);
}

export function findAllFilesRecursive(fileEntry: FileEntry, list: FileEntry[] = []) {
  if (fileEntry.children) {
    fileEntry.children.forEach((child) => {
      if (child.isFolder) {
        findAllFilesRecursive(child, list);
      } else if (isImage(child) || isVideo(child)) {
        list.push(child);
      }
    });
  }

  return list;
}
