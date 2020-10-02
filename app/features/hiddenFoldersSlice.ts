import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

export interface HiddenFolders {
  [key: string]: boolean;
}

type State = {
  folders: HiddenFolders;
};

const hiddenFoldersSlice = createSlice({
  name: 'hiddenFolders',
  initialState: <State>{ folders: {} },
  reducers: {
    toggleHiddenFolder: (state, action) => {
      if (state.folders[action.payload]) {
        delete state.folders[action.payload];
      } else {
        state.folders[action.payload] = true;
      }
    },
  },
});

export const { toggleHiddenFolder } = hiddenFoldersSlice.actions;

export default hiddenFoldersSlice.reducer;

export const selectHiddenFolders = (state: RootState) => state.hiddenFolders.folders;
