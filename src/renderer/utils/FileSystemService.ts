import { ipcRenderer } from 'electron';
import Promise from 'bluebird';
import { orderBy } from 'lodash';
import FileEntry from '../models/FileEntry';

// const queue = new PQueue({ concurrency: 1 });
const promises = new Map();

interface Job {
  callback: Function;
  resolve: (error: any) => unknown;
  reject: (error: any) => unknown;
  cancelled: boolean;
}

interface Options {
  priority?: number;
}

class PromiseQueue {
  jobs: Job[] = [];

  currentJob: Job | null = null;

  nextTick: NodeJS.Timeout | null = null;

  add<T>(callback: Function, options: Options = {}): Promise<T> {
    return new Promise((resolve, reject, onCancel) => {
      const job = {
        callback,
        resolve,
        reject,
        cancelled: false,
        priority: options.priority || 0,
      };
      this.jobs.push(job);
      this.jobs = orderBy(this.jobs, 'priority', 'desc');
      if (onCancel) {
        onCancel(() => {
          job.cancelled = true;
        });
      }

      this.scheduleNext();
    });
  }

  scheduleNext() {
    if (!this.nextTick && !this.currentJob) {
      this.nextTick = setTimeout(() => this.maybeRunNext(), 0);
    }
  }

  maybeRunNext() {
    this.nextTick = null;
    if (!this.currentJob) {
      const job = this.jobs.shift();
      if (job) {
        if (job.cancelled) {
          this.scheduleNext();
        } else {
          this.runJob(job);
        }
      }
    }
  }

  runJob(job: Job) {
    Promise.resolve()
      .then(() => job.callback())
      .then(job.resolve)
      .finally(() => this.clearCurrentAndStartNext())
      .catch(job.reject);
  }

  clearCurrentAndStartNext() {
    this.currentJob = null;
    this.scheduleNext();
  }
}

const queue = new PromiseQueue();

const getChildren = (fullPath: string, options: Options = {}): Promise<FileEntry[]> => {
  if (promises.has(fullPath)) {
    return promises.get(fullPath);
  }

  const promise = queue
    .add<FileEntry[]>(() => ipcRenderer.invoke('get-children', fullPath), options)
    .finally(() => promises.delete(fullPath));

  promises.set(fullPath, promise);

  return promise;
};

export default {
  getChildren,
};
