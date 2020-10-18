import { createSlice } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';
// eslint-disable-next-line import/no-cycle
import FileEntry, { findFolderAndIndex } from '../utils/FileEntry';

type State = {
  folder: FileEntry | null;
  path: string | null;
  cachePath: string | null;
};

const rootFolderSlice = createSlice({
  name: 'rootFolder',
  initialState: <State>{ folder: null, path: null, cachePath: null },
  reducers: {
    setRootFolder: (state, action) => {
      state.folder = action.payload;
    },
    setRootFolderPath: (state, action) => {
      state.path = action.payload;
    },
    setCachePath: (state, action) => {
      state.cachePath = action.payload;
    },
    updateFile: (state, action) => {
      const { folder, index } = findFolderAndIndex(state.folder, action.payload.fullPath);
      if (folder && folder.children !== null) {
        if (index !== null) {
          folder.children[index] = action.payload;
        } else {
          folder.children.push(action.payload);
        }
      }
    },
    removeFile: (state, action) => {
      const { folder, index } = findFolderAndIndex(state.folder, action.payload);
      if (folder && folder.children !== null && index !== null) {
        folder.children.splice(index, 1);
      }
    },
  },
});

export const { setRootFolder, setRootFolderPath, setCachePath, updateFile, removeFile } = rootFolderSlice.actions;

export default rootFolderSlice.reducer;

export const selectRootFolder = (state: RootState) => state.rootFolder.folder;
export const selectRootFolderPath = (state: RootState) => state.rootFolder.path;
export const selectCachePath = (state: RootState) => state.rootFolder.cachePath;
