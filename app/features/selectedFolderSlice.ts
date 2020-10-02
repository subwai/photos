import { createSlice } from '@reduxjs/toolkit';
import { defaultTo } from 'lodash';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';
// eslint-disable-next-line import/no-cycle
import FileEntry from '../utils/FileEntry';

type State = {
  folder: FileEntry | null;
  autoSelectLast: boolean;
  file: FileEntry | null;
};

const selectedFolderSlice = createSlice({
  name: 'selectedFolder',
  initialState: <State>{ folder: null, autoSelectLast: false, file: null },
  reducers: {
    setSelectedFolder: (state, action) => {
      if (action.payload?.folder) {
        state.folder = action.payload.folder;
        state.autoSelectLast = defaultTo(action.payload.autoSelectLast, state.autoSelectLast);
      } else {
        state.folder = action.payload;
      }
    },
    setSelectedFile: (state, action) => {
      state.file = action.payload;
    },
  },
});

export const { setSelectedFolder, setSelectedFile } = selectedFolderSlice.actions;

export default selectedFolderSlice.reducer;

export const selectSelectedFile = (state: RootState) => state.selectedFolder.file;
export const selectSelectedFolder = (state: RootState) => state.selectedFolder.folder;
export const selectAutoSelectLastFolder = (state: RootState) => state.selectedFolder.autoSelectLast;
