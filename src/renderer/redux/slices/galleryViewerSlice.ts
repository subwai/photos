import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from 'renderer/redux/store';

export const sortByValues = ['fullPath', 'accessedTime', 'modifiedTime', 'createdTime'] as const;
export type SortBy = typeof sortByValues[number];

export const sortDirectionValues = ['asc', 'desc'] as const;
export type SortDirection = typeof sortDirectionValues[number];

export type State = {
  height: number;
  sortBy: SortBy;
  sortDirection: SortDirection;
  count: number;
  viewer: 'grid' | 'line';
};

const galleryViewerSlice = createSlice({
  name: 'galleryViewer',
  // eslint-disable-next-line prettier/prettier
  initialState: <State>{ height: 120, sortBy: 'fullPath', sortDirection: 'asc', count: 0, viewer: 'grid' },
  reducers: {
    setHeight: (state, action) => {
      state.height = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSortDirection: (state, action) => {
      state.sortDirection = action.payload;
    },
    setFilesCount: (state, action) => {
      state.count = action.payload;
    },
    setViewer: (state, action) => {
      state.viewer = action.payload;
    },
  },
});

export const { setHeight, setSortBy, setSortDirection, setFilesCount, setViewer } = galleryViewerSlice.actions;

export default galleryViewerSlice.reducer;

export const selectGalleryScrollerHeight = (state: RootState) => state.galleryScroller.height;
export const selectGallerySortBy = (state: RootState) => state.galleryScroller.sortBy;
export const selectGallerySortDirection = (state: RootState) => state.galleryScroller.sortDirection;
export const selectGalleryViewer = (state: RootState) => state.galleryScroller.viewer;
export const selectFilesCount = (state: RootState) => state.galleryScroller.count;
