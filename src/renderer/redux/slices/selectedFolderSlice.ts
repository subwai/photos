import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { FileEntryModel } from '../../models/FileEntry';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

type State = {
  file: FileEntryModel | null;
};

const selectedFolderSlice = createSlice({
  name: 'selectedFolder',
  initialState: <State>{ autoSelectLast: false, file: null },
  reducers: {
    setSelectedFile: (state, action) => {
      state.file = action.payload;
    },
  },
});

export const { setSelectedFile } = selectedFolderSlice.actions;

export default selectedFolderSlice.reducer;

export const selectSelectedFile = (state: RootState) => state.selectedFolder.file;
