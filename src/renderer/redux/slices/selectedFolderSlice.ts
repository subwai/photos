import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { FileEntryModel } from '../../models/FileEntry';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

type State = {
  folder: FileEntryModel | null;
  file: FileEntryModel | null;
};

const selectedFolderSlice = createSlice({
  name: 'selectedFolder',
  initialState: <State>{ folder: null, autoSelectLast: false, file: null },
  reducers: {
    setSelectedFolder: (state, action) => {
      state.folder = action.payload;
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

export const SELECTED_FOLDER_UPDATE_DEBOUNCE = 250;
