import { createSlice } from '@reduxjs/toolkit';
import type { FileEntryModel } from '../../models/FileEntry';
import type { RootState } from '../store';

type State = {
  file: FileEntryModel | null;
  index: number | null;
};

const selectedFolderSlice = createSlice({
  name: 'selectedFolder',
  initialState: <State>{ file: null, index: null },
  reducers: {
    setSelectedFile: (state, action) => {
      state.file = action.payload;
    },
    setSelectedIndex: (state, action) => {
      state.index = action.payload;
    },
  },
});

export const { setSelectedFile, setSelectedIndex } = selectedFolderSlice.actions;

export default selectedFolderSlice.reducer;

export const selectSelectedFile = (state: RootState) => state.selectedFolder.file;
export const selectSelectedIndex = (state: RootState) => state.selectedFolder.index;
