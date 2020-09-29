import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../../store';

type State = {
  height: number;
};

const galleryScrollerSlice = createSlice({
  name: 'galleryScroller',
  initialState: <State>{ height: 120 },
  reducers: {
    setHeight: (state, action) => {
      state.height = action.payload;
    },
  },
});

export const { setHeight } = galleryScrollerSlice.actions;

export default galleryScrollerSlice.reducer;

export const selectGalleryScrollerHeight = (state: RootState) => state.galleryScroller.height;
