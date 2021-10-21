import Promise from 'bluebird';
// eslint-disable-next-line import/no-cycle
import FileEntryObject, { Children } from '../models/FileEntry';
import PromiseQueue, { PromiseQueueJobOptions } from './PromiseQueue';

const promises = new Map();
const queue = new PromiseQueue();

const getChildren = (fullPath: string, options: PromiseQueueJobOptions = {}): Promise<Children<FileEntryObject>> => {
  if (promises.has(fullPath)) {
    return promises.get(fullPath);
  }

  const promise = queue
    .add<Children<FileEntryObject>>(() => window.electron.invoke('get-children', fullPath), options)
    .finally(() => promises.delete(fullPath));

  promises.set(fullPath, promise);

  return promise;
};

export default {
  getChildren,
};
