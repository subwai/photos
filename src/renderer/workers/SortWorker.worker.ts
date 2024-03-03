import { debounce, orderBy } from 'lodash';
import natsort from 'natsort';

import type { SortEvent, SortedEvent } from 'renderer/workers/types';

/* eslint-disable no-restricted-globals */
const ctx: Worker = self as any;

function processSorting(event: SortEvent) {
  const sortedObjects = sort(event.data);

  const sortedData: SortedEvent['data'] = { sortedFullPaths: sortedObjects.map((file) => file.fullPath) };
  ctx.postMessage(sortedData);
}

function sort({ fileObjects, sortBy, sortDirection }: SortEvent['data']) {
  if (sortBy === 'fullPath') {
    const sorter = natsort({
      insensitive: true,
      desc: sortDirection === 'desc',
    });
    return fileObjects.sort((a, b) => sorter(a[sortBy], b[sortBy])) || [];
  }

  return orderBy(fileObjects, sortBy, sortDirection);
}

const debouncedProcessSorting = debounce(processSorting);

ctx.addEventListener('message', debouncedProcessSorting);
