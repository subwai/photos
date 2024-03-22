import type Promise from 'bluebird';
import { useSyncExternalStore } from 'react';

import type FileEntryObject from 'renderer/models/FileEntry';
import type { Children, CoverEntryObject } from 'renderer/models/FileEntry';
import PromiseQueue, { PromiseQueueJobOptions } from 'renderer/utils/PromiseQueue';

const promises = new Map();
const queue = new PromiseQueue();

const getChildren = (fullPath: string, options: PromiseQueueJobOptions = {}): Promise<Children<FileEntryObject>> => {
  const key = `${fullPath}-getChildren`;
  if (promises.has(key)) {
    return promises.get(key);
  }

  const promise = queue
    .add<Children<FileEntryObject>>(() => window.electron.invoke('get-children', fullPath), options)
    .finally(() => promises.delete(key))
    .finally(emitChangeIfStoppedProcessing);

  promises.set(key, promise);
  emitChangeIfStartedProcessing();

  return promise;
};

const getCover = (fullPath: string, options: PromiseQueueJobOptions = {}): Promise<CoverEntryObject | null> => {
  const key = `${fullPath}-getCover`;
  if (promises.has(key)) {
    return promises.get(key);
  }

  const promise = queue
    .add<CoverEntryObject>(() => window.electron.invoke('get-cover', fullPath), options)
    .finally(() => promises.delete(key))
    .finally(emitChangeIfStoppedProcessing);

  promises.set(key, promise);
  emitChangeIfStartedProcessing();

  return promise;
};

const listeners = new Set<Function>();

export const fileSystemService = {
  subscribe(listener: Function) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  isWorking() {
    return promises.size > 0;
  },
};

function emitChangeIfStartedProcessing() {
  if (promises.size === 1) {
    emitChange();
  }
}
function emitChangeIfStoppedProcessing() {
  if (promises.size === 0) {
    emitChange();
  }
}

function emitChange() {
  listeners.forEach((listener) => {
    listener();
  });
}

export function useIsFileSystemServiceWorking() {
  return useSyncExternalStore(fileSystemService.subscribe, fileSystemService.isWorking);
}

export default {
  getChildren,
  getCover,
};
