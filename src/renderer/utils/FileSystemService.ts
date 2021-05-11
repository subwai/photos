import { ipcRenderer } from 'electron';
import Promise from 'bluebird';
import PQueue from 'p-queue';
import { QueueAddOptions } from 'p-queue/dist/options';
import FileEntry from '../models/FileEntry';

const queue = new PQueue({ concurrency: 1 });

const getChildren = (fullPath: string, options?: QueueAddOptions): Promise<FileEntry[]> => {
  return new Promise((resolve, reject, onCancel) => {
    const job = { cancelled: false };

    queue
      .add(() => !job.cancelled && ipcRenderer.invoke('get-children', fullPath), options)
      .then(resolve)
      .catch(reject);

    if (onCancel) {
      onCancel(() => {
        job.cancelled = true;
      });
    }
  });
};

export default {
  getChildren,
};
