import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

type State = {
  size: number;
};

const folderSizeSlice = createSlice({
  name: 'folderSize',
  initialState: <State>{ size: 40 },
  reducers: {
    setFolderSize: (state, action) => {
      state.size = action.payload;
    },
  },
});

export const { setFolderSize } = folderSizeSlice.actions;

export default folderSizeSlice.reducer;

export const selectFolderSize = (state: RootState) => state.folderSize.size;
