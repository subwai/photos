import Promise, { CancellationError } from 'bluebird';
import { debounce, orderBy } from 'lodash';

export interface PromiseQueueJobOptions {
  priority?: number;
}

export interface PromiseQueueOptions {
  concurrency: number;
}

interface Job {
  callback: Function;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  cancelled: boolean;
  priority: number;
}

export default class PromiseQueue {
  jobs: Job[] = [];

  currentJobs = new Set<Job>();

  nextTick: NodeJS.Timeout | null = null;

  options: PromiseQueueOptions;

  constructor(options: PromiseQueueOptions = { concurrency: 10 }) {
    this.options = options;
  }

  sortJobsDebounced = debounce(() => {
    this.jobs = orderBy(this.jobs, 'priority', 'desc');
  }, 200);

  add<T>(callback: Function, options: PromiseQueueJobOptions = {}): Promise<T> {
    return new Promise((resolve, reject, onCancel) => {
      const job: Job = {
        callback,
        resolve,
        reject,
        cancelled: false,
        priority: options.priority || 0,
      };
      this.jobs.push(job);
      this.sortJobsDebounced();
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
      const job = this.getNextJob();
      if (job) {
        this.runJob(job);
      }
    }
  }

  getNextJob(): Job | undefined {
    let job: Job | undefined;
    do {
      job = this.jobs.shift();
    } while (job?.cancelled);

    return job;
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

  clear() {
    this.jobs.forEach((job) => {
      job.cancelled = true;
      job.reject(new CancellationError('Queue was cleared'));
    });
  }
}
