import Promise from 'bluebird';
import { orderBy } from 'lodash';

export interface PromiseQueueJobOptions {
  priority?: number;
}

export interface PromiseQueueOptions {
  concurrency: number;
}

interface Job {
  callback: Function;
  resolve: (error: any) => unknown;
  reject: (error: any) => unknown;
  cancelled: boolean;
}

export default class PromiseQueue {
  jobs: Job[] = [];

  currentJobs = new Set<Job>();

  nextTick: NodeJS.Timeout | null = null;

  options: PromiseQueueOptions;

  constructor(options: PromiseQueueOptions = { concurrency: 1 }) {
    this.options = options;
  }

  add<T>(callback: Function, options: PromiseQueueJobOptions = {}): Promise<T> {
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

      this.maybeRunNext();
    });
  }

  maybeRunNext() {
    if (this.hasOpenSlots()) {
      const job = this.jobs.shift();
      if (job) {
        if (job.cancelled) {
          this.maybeRunNext();
        } else {
          this.runJob(job);
        }
      }
    }
  }

  hasOpenSlots() {
    return this.currentJobs.size < this.options.concurrency;
  }

  runJob(job: Job) {
    this.currentJobs.add(job);

    Promise.resolve()
      .then(() => job.callback())
      .then(job.resolve)
      .finally(() => {
        this.currentJobs.delete(job);
        this.maybeRunNext();
      })
      .catch(job.reject);
  }
}
