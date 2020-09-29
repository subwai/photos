import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../../store';

type State = {
  path: string | null;
};

const currentFolderSlice = createSlice({
  name: 'currentFolder',
  initialState: <State>{ path: null },
  reducers: {
    setFolder: (state, action) => {
      state.path = action.payload;
    },
  },
});

export const { setFolder } = currentFolderSlice.actions;

export default currentFolderSlice.reducer;

export const selectCurrentFolder = (state: RootState) => state.currentFolder.path;
