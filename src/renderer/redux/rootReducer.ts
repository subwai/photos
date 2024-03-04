import { combineReducers } from 'redux';

import folderVisibilityReducer from 'renderer/redux/slices/folderVisibilitySlice';
import galleryScrollerReducer from 'renderer/redux/slices/galleryViewerSlice';
import rootFolderReducer from 'renderer/redux/slices/rootFolderSlice';
import selectedFolderReducer from 'renderer/redux/slices/selectedFolderSlice';
import viewerReducer from 'renderer/redux/slices/viewerSlice';

export default function createRootReducer() {
  return combineReducers({
    viewer: viewerReducer,
    folderVisibility: folderVisibilityReducer,
    galleryScroller: galleryScrollerReducer,
    rootFolder: rootFolderReducer,
    selectedFolder: selectedFolderReducer,
  });
}
