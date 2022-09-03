import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';

export interface FoldersHash {
  [key: string]: boolean;
}

type State = {
  hidden: FoldersHash;
  open: FoldersHash;
};

const folderVisibilitySlice = createSlice({
  name: 'folderVisibility',
  initialState: <State>{ hidden: {}, open: {} },
  reducers: {
    toggleHiddenFolder: (state, action) => {
      state.hidden = { ...state.hidden };
      if (state.hidden[action.payload.fullPath]) {
        delete state.hidden[action.payload.fullPath];
      } else {
        state.hidden[action.payload.fullPath] = true;
      }
    },
    openFolder: (state, action) => {
      state.open[action.payload.fullPath] = true;
    },
    closeFolder: (state, action) => {
      delete state.open[action.payload.fullPath];
    },
  },
});

export const { toggleHiddenFolder, openFolder, closeFolder } = folderVisibilitySlice.actions;

export default folderVisibilitySlice.reducer;

export const selectHiddenFolders = (state: RootState) => state.folderVisibility.hidden;
export const selectOpenFolders = (state: RootState) => state.folderVisibility.open;
