import Promise from 'bluebird';
import { each, find, findLast, includes } from 'lodash';
import path from 'path';

import type { FoldersHash } from 'renderer/redux/slices/folderVisibilitySlice';
import FileSystemService from 'renderer/utils/FileSystemService';
import type { PromiseQueueJobOptions } from 'renderer/utils/PromiseQueue';

export default interface FileEntryObject {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: Children<FileEntryObject>;
  accessedTime: Date;
  modifiedTime: Date;
  createdTime: Date;
  level: number;
}

export type Children<T> = { [key: string]: T } | null;

export type EventName = 'all' | 'update' | 'rerender' | 'add' | 'remove';

export class FileEntryModel implements FileEntryObject {
  didLoadChildren: boolean;

  children: Children<FileEntryModel>;

  fullPath: string;

  isFolder: boolean;

  level: number;

  accessedTime: Date;

  modifiedTime: Date;

  createdTime: Date;

  name: string;

  cover?: FileEntryModel;

  didLoadCover: boolean;

  parent: FileEntryModel | undefined;

  listeners: { [key in EventName]: Set<Function> };

  rerenderListeners: Set<Function>;

  constructor(props: { parent?: FileEntryModel } & FileEntryObject) {
    this.children = props.children ? this.convertToFileEntryModels(props.children) : null;
    this.didLoadChildren = !!props.children;
    this.fullPath = props.fullPath;
    this.isFolder = props.isFolder;
    this.level = props.level;
    this.accessedTime = props.accessedTime;
    this.modifiedTime = props.modifiedTime;
    this.createdTime = props.createdTime;
    this.name = props.name;
    this.parent = props.parent;
    this.cover = this.findFirstImageOrVideo();
    this.didLoadCover = !!this.cover;
    this.listeners = {
      all: new Set(),
      update: new Set(),
      add: new Set(),
      remove: new Set(),
      rerender: new Set(),
    };
    this.rerenderListeners = new Set();
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

  find(fullPath: string): FileEntryModel | undefined {
    const escapedFullPath = this.fullPath.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const arrayPath = fullPath
      .replace(new RegExp(`${escapedFullPath}[\\\\/]?`), '')
      .split(/[\\/]/)
      .filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let entry: FileEntryModel | undefined = this;

    while (arrayPath.length > 0) {
      const childName = arrayPath.shift();
      entry = childName && entry.children ? entry.children[childName] : undefined;
      if (!entry) {
        return undefined;
      }
    }

    return entry;
  }

  isVideo() {
    return isVideo(this);
  }

  setChildren(children: Children<FileEntryObject>) {
    this.children = null;
    this.addChildren(children);
  }

  addChildren(children: Children<FileEntryObject>) {
    if (!this.children) {
      this.children ??= {};
      each(children, (child) => {
        this.children ??= {};
        this.children[child.name] = this.convertToFileEntryModel(child);
      });
      this.didLoadChildren = true;
      this.updateCover();
      this.didLoadCover = true;
      this.triggerRerender();
    }
  }

  convertToFileEntryModels(children: Children<FileEntryObject>): Children<FileEntryModel> {
    const carry: Children<FileEntryModel> = {};
    each(children, (child) => {
      carry[child.name] = this.convertToFileEntryModel(child);
    });

    return carry;
  }

  convertToFileEntryModel(child: FileEntryObject): FileEntryModel {
    return child instanceof FileEntryModel ? child : new FileEntryModel(Object.assign(child, { parent: this }));
  }

  refreshChildren(options: PromiseQueueJobOptions = {}): Promise<Children<FileEntryModel>> {
    if (!this.isFolder) {
      return Promise.resolve(null);
    }

    return FileSystemService.getChildren(this.fullPath, options)
      .then((children) => children && this.setChildren(children))
      .then(() => this.children);
  }

  loadChildren(options: PromiseQueueJobOptions = {}): Promise<Children<FileEntryModel>> {
    if (!this.isFolder) {
      return Promise.resolve(null);
    }

    if (this.children) {
      return Promise.resolve(this.children);
    }

    return FileSystemService.getChildren(this.fullPath, options)
      .then((children) => children && this.addChildren(children))
      .then(() => this.children);
  }

  addEventListener(eventName: EventName, callback: (event: FileEntryEvent) => void) {
    this.listeners[eventName] = this.listeners[eventName] || new Set();
    this.listeners[eventName].add(callback);
  }

  removeEventListener(eventName: EventName, callback: (event: FileEntryEvent) => void) {
    this.listeners[eventName].delete(callback);
  }

  triggerEvent(eventName: EventName, target: FileEntryModel | null = this) {
    this.listeners[eventName].forEach((callback) => callback({ target }));
    this.listeners.all.forEach((callback) => callback({ target }));
    this.parent?.triggerEvent(eventName, target);
    this.parent?.triggerEvent('all', target);
  }

  triggerEventSoon(eventName: EventName, target: FileEntryModel | null = this) {
    setTimeout(() => this.triggerEvent(eventName, target), 0);
  }

  addRerenderListener(callback: (event: FileEntryEvent) => void) {
    this.rerenderListeners.add(callback);
  }

  removeRerenderListener(callback: (event: FileEntryEvent) => void) {
    this.rerenderListeners.delete(callback);
  }

  triggerRerender(target: FileEntryModel | null = this) {
    this.rerenderListeners.forEach((callback) => callback({ target }));
    this.parent?.triggerRerender(target);
  }

  findFirstImageOrVideo() {
    return this.children ? findFirstImageOrVideo(this.children) : undefined;
  }

  refreshCover(options: PromiseQueueJobOptions = {}): Promise<FileEntryModel | undefined> {
    if (!this.isFolder) {
      return Promise.resolve(undefined);
    }

    return FileSystemService.getCover(this.fullPath, options)
      .then((cover) => {
        this.cover = cover ? this.convertToFileEntryModel(cover) : undefined;
        this.didLoadCover = true;
        this.triggerRerender();
      })
      .then(() => this.cover);
  }

  updateCover() {
    this.cover = this.findFirstImageOrVideo() || this.cover;
  }

  hasCover() {
    return !!this.cover;
  }
}

export interface FileEntryEvent {
  target: FileEntryModel;
}

export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.avi', '.wmv', '.flv'];
export const VIDEO_THUMBNAIL_EXTENSIONS = ['.webp', ...VIDEO_EXTENSIONS];

export function isImage(fileEntry: FileEntryObject) {
  return !fileEntry.isFolder && includes(IMAGE_EXTENSIONS, path.extname(fileEntry.fullPath).toLowerCase());
}

export function isVideo(fileEntry: FileEntryObject) {
  return !fileEntry.isFolder && includes(VIDEO_EXTENSIONS, path.extname(fileEntry.fullPath).toLowerCase());
}

export function isVideoThumbnail(fileEntry: FileEntryObject) {
  return !fileEntry.isFolder && includes(VIDEO_THUMBNAIL_EXTENSIONS, path.extname(fileEntry.fullPath).toLowerCase());
}

export function isImageOrVideo(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  return includes(VIDEO_EXTENSIONS, ext) || includes(IMAGE_EXTENSIONS, ext);
}

export function findFirstFolder(fileEntry: FileEntryObject) {
  return fileEntry.children && find(fileEntry.children, 'isFolder');
}

export function findLastFolder(fileEntry: FileEntryObject) {
  return fileEntry.children && findLast(fileEntry.children, 'isFolder');
}

export function findFirstImageOrVideo<T extends FileEntryObject>(fileEntries: Children<T>) {
  return find(fileEntries, (child) => isImage(child) || isVideo(child));
}

export function findAllFilesRecursive(
  fileEntry: FileEntryObject,
  hiddenFolders: FoldersHash,
  list: FileEntryObject[] = [],
) {
  if (fileEntry.children) {
    each(fileEntry.children, (child) => {
      if (child.isFolder && !hiddenFolders[child.fullPath]) {
        findAllFilesRecursive(child, hiddenFolders, list);
      } else if (isImage(child) || isVideo(child)) {
        list.push(child);
      }
    });
  }

  return list;
}
