import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

type State = {
  size: number;
};

export const DEFAULT_FOLDER_SIZE = 40;

const folderSizeSlice = createSlice({
  name: 'folderSize',
  initialState: <State>{ size: DEFAULT_FOLDER_SIZE },
  reducers: {
    setFolderSize: (state, action) => {
      state.size = action.payload;
    },
  },
});

export const { setFolderSize } = folderSizeSlice.actions;

export default folderSizeSlice.reducer;

export const selectFolderSize = (state: RootState) => state.folderSize.size;
