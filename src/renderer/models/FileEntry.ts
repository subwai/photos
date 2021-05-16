import Promise from 'bluebird';
import { find, findIndex, findLast, identity, includes, map } from 'lodash';
import path from 'path';
// eslint-disable-next-line import/no-cycle
import { FoldersHash } from '../redux/slices/folderVisibilitySlice';
// eslint-disable-next-line import/no-cycle
import FileSystemService, { FileSystemOptions } from '../utils/FileSystemService';

export default interface FileEntry {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: FileEntry[] | null;
  level: number;
}

export class FileEntryModel implements FileEntry {
  children: FileEntryModel[] | null;

  fullPath: string;

  isFolder: boolean;

  level: number;

  name: string;

  parent: FileEntryModel | undefined;

  listeners: { [key: string]: Set<Function> };

  constructor(props: { parent?: FileEntryModel } & FileEntry) {
    this.children = props.children ? this.convertToFileEntryModels(props.children) : null;
    this.fullPath = props.fullPath;
    this.isFolder = props.isFolder;
    this.level = props.level;
    this.name = props.name;
    this.parent = props.parent;
    this.listeners = {
      all: new Set(),
      update: new Set(),
      add: new Set(),
      remove: new Set(),
    };
  }

  get isRoot() {
    return !this.parent;
  }

  get objectPath(): string {
    return this.fullPath
      .toLowerCase()
      .replace(/[a-z]:[\\/]+/, '')
      .replaceAll(' ', '_')
      .replaceAll('/', '.')
      .replaceAll('\\', '.');
  }

  values() {
    return {
      name: this.name,
      fullPath: this.fullPath,
      isFolder: this.isFolder,
      children: null,
      level: this.level,
    };
  }

  addChildren(children: FileEntry[]) {
    if (!this.children) {
      this.children = this.convertToFileEntryModels(children);
      this.triggerEvent('update');
    }
  }

  convertToFileEntryModels(children: FileEntry[]) {
    return map<FileEntry, FileEntryModel>(children, (child) =>
      child instanceof FileEntryModel ? child : new FileEntryModel(Object.assign(child, { parent: this }))
    );
  }

  loadChildren(options: FileSystemOptions = {}): Promise<FileEntryModel[]> {
    if (!this.isFolder) {
      return Promise.resolve([]);
    }

    return FileSystemService.getChildren(this.fullPath, options)
      .then((children) => children && this.addChildren(children))
      .then(() => this.children || []);
  }

  addEventListener(eventName: string, callback: (event: FileEntryEvent) => void) {
    this.listeners[eventName] = this.listeners[eventName] || new Set();
    this.listeners[eventName].add(callback);
  }

  removeEventListener(eventName: string, callback: (event: FileEntryEvent) => void) {
    this.listeners[eventName].delete(callback);
  }

  triggerEvent(eventName: string, target: FileEntryModel | null = this) {
    this.listeners[eventName].forEach((callback) => callback({ target }));
    this.listeners.all.forEach((callback) => callback({ target }));
    this.parent?.triggerEvent(eventName, target);
    this.parent?.triggerEvent('all', target);
  }

  triggerEventSoon(eventName: string, target: FileEntryModel | null = this) {
    setTimeout(() => this.triggerEvent(eventName, target), 0);
  }
}

export interface FileEntryEvent {
  target: FileEntryModel;
}

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];

export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.webp', '.avi'];

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

export function findFirstImageOrVideo(fileEntry: FileEntryModel) {
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

  const levels = filePath.substr(rootFolder.fullPath.length).split(/[\\/]/).filter(identity);
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
