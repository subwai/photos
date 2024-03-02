import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from 'renderer/redux/store';

const viewerSlice = createSlice({
  name: 'viewer',
  initialState: { playing: false, preview: false },
  reducers: {
    play: (state) => {
      state.playing = true;
    },
    pause: (state) => {
      state.playing = false;
    },
    setPreview: (state, action) => {
      state.preview = action.payload;
    },
  },
});

export const { play, pause, setPreview } = viewerSlice.actions;

export default viewerSlice.reducer;

export const selectPlaying = (state: RootState) => state.viewer.playing;
export const selectPreview = (state: RootState) => state.viewer.preview;
