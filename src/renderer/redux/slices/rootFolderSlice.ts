import { createSlice } from '@reduxjs/toolkit';
import { get } from 'lodash';
// eslint-disable-next-line import/no-cycle
import FileEntryObject, { FileEntryModel } from '../../models/FileEntry';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';

type State = {
  folder: FileEntryModel | null;
  path: string | null;
  cachePath: string | null;
};

const rootFolderSlice = createSlice({
  name: 'rootFolder',
  initialState: <State>{ folder: null, path: null, cachePath: null },
  reducers: {
    setRootFolder: (state, action) => {
      state.folder = action.payload ? new FileEntryModel(action.payload) : null;
    },
    setRootFolderPath: (state, action) => {
      state.path = action.payload;
    },
    setCachePath: (state, action) => {
      state.cachePath = action.payload;
    },
    updateFile: (state, action: { payload: { entry: FileEntryObject; eventType: string } }) => {
      const { entry } = action.payload;
      const parent = state.folder?.find(entry.fullPath.slice(0, -(entry.name.length + 1)));
      if (parent) {
        parent.children = parent.children || {};
        const fileModel = parent.convertToFileEntryModel(entry);
        const childExistOnParent = !!parent.children[fileModel.name];

        parent.children[fileModel.name] = parent.children[fileModel.name] || fileModel;
        if (childExistOnParent) {
          parent.children[fileModel.name].triggerEventSoon('update');
        } else {
          parent.children[fileModel.name].triggerEventSoon('add');
        }
      }
    },
    removeFile: (state, action) => {
      const fullPath = action.payload as string;
      const fileToDelete = state.folder?.find(fullPath);

      if (fileToDelete && fileToDelete.parent?.children) {
        delete fileToDelete.parent.children[fileToDelete.name];
        fileToDelete.triggerEventSoon('remove');
      }
    },
  },
});

export const { setRootFolder, setRootFolderPath, setCachePath, updateFile, removeFile } = rootFolderSlice.actions;

export default rootFolderSlice.reducer;

export const selectRootFolder = (state: RootState) => state.rootFolder.folder;
export const selectRootFolderPath = (state: RootState) => state.rootFolder.path;
export const selectCachePath = (state: RootState) => state.rootFolder.cachePath;
export const selectFolder = (path: string | undefined) => (state: RootState) =>
  path === undefined ? state.rootFolder.folder : get(state.rootFolder.folder, path);
