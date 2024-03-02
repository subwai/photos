import type Promise from 'bluebird';

import type FileEntryObject from 'renderer/models/FileEntry';
import type { Children } from 'renderer/models/FileEntry';
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
    .finally(() => promises.delete(key));

  promises.set(key, promise);

  return promise;
};

const getCover = (fullPath: string, options: PromiseQueueJobOptions = {}): Promise<FileEntryObject | null> => {
  const key = `${fullPath}-getCover`;
  if (promises.has(key)) {
    return promises.get(key);
  }

  const promise = queue
    .add<FileEntryObject>(() => window.electron.invoke('get-cover', fullPath), options)
    .finally(() => promises.delete(key));

  promises.set(key, promise);

  return promise;
};

export default {
  getChildren,
  getCover,
};
