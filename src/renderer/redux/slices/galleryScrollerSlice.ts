import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

type State = {
  height: number;
  sort: string;
};

const galleryScrollerSlice = createSlice({
  name: 'galleryScroller',
  initialState: <State>{ height: 120, sort: 'fullPath:asc' },
  reducers: {
    setHeight: (state, action) => {
      state.height = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
  },
});

export const { setHeight, setSort } = galleryScrollerSlice.actions;

export default galleryScrollerSlice.reducer;

export const selectGalleryScrollerHeight = (state: RootState) => state.galleryScroller.height;
export const selectGallerySort = (state: RootState) => state.galleryScroller.sort;
