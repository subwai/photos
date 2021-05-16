import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

export type State = {
  height: number;
  sort: string;
  count: number;
  viewer: 'grid' | 'line';
};

const galleryViewerSlice = createSlice({
  name: 'galleryViewer',
  initialState: <State>{ height: 120, sort: 'fullPath:asc', count: 0, viewer: 'line' },
  reducers: {
    setHeight: (state, action) => {
      state.height = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setFilesCount: (state, action) => {
      state.count = action.payload;
    },
    setViewer: (state, action) => {
      state.viewer = action.payload;
    },
  },
});

export const { setHeight, setSort, setFilesCount, setViewer } = galleryViewerSlice.actions;

export default galleryViewerSlice.reducer;

export const selectGalleryScrollerHeight = (state: RootState) => state.galleryScroller.height;
export const selectGallerySort = (state: RootState) => state.galleryScroller.sort;
export const selectGalleryViewer = (state: RootState) => state.galleryScroller.viewer;
export const selectFilesCount = (state: RootState) => state.galleryScroller.count;
