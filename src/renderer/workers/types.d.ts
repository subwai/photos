import type { SortBy, SortDirection } from 'renderer/redux/slices/galleryViewerSlice';

export type MinimalFileObject = {
  fullPath: string;
  accessedTime: Date;
  modifiedTime: Date;
  createdTime: Date;
};

type SortData = {
  fileObjects: MinimalFileObject[];
  sortBy: SortBy;
  sortDirection: SortDirection;
};
export type SortEvent = MessageEvent<SortData>;

type SortedData = {
  sortedFullPaths: string[];
};

export type SortedEvent = MessageEvent<SortedData>;
