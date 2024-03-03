import { createSlice } from '@reduxjs/toolkit';

import type { RootState } from 'renderer/redux/store';

export type PreviewType = 'file' | 'cover';

type State = {
  playing: boolean;
  preview: boolean;
  previewType: PreviewType;
};

const viewerSlice = createSlice({
  name: 'viewer',
  // eslint-disable-next-line prettier/prettier
  initialState: <State>{ playing: false, preview: false, previewType: 'file' },
  reducers: {
    play: (state) => {
      state.playing = true;
    },
    pause: (state) => {
      state.playing = false;
    },
    setPreview: (state, action) => {
      state.preview = action.payload;
      if (!state.preview) {
        state.previewType = 'file';
      }
    },
    setPreviewType: (state, action) => {
      state.previewType = action.payload;
    },
  },
});

export const { play, pause, setPreview, setPreviewType } = viewerSlice.actions;

export default viewerSlice.reducer;

export const selectPlaying = (state: RootState) => state.viewer.playing;
export const selectPreview = (state: RootState) => state.viewer.preview;
export const selectPreviewType = (state: RootState) => state.viewer.previewType;
