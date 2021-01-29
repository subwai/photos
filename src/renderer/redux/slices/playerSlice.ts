import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../../store';

const playerSlice = createSlice({
  name: 'player',
  initialState: { playing: false },
  reducers: {
    play: (state) => {
      state.playing = true;
    },
    pause: (state) => {
      state.playing = false;
    },
  },
});

export const { play, pause } = playerSlice.actions;

export default playerSlice.reducer;

export const selectPlaying = (state: RootState) => state.player.playing;
