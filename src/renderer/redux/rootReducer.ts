/* eslint-disable import/no-cycle */
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import { combineReducers } from 'redux';
import folderVisibilityReducer from './slices/folderVisibilitySlice';
import galleryScrollerReducer from './slices/galleryViewerSlice';
import viewerReducer from './slices/viewerSlice';
import rootFolderReducer from './slices/rootFolderSlice';
import selectedFolderReducer from './slices/selectedFolderSlice';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    viewer: viewerReducer,
    folderVisibility: folderVisibilityReducer,
    galleryScroller: galleryScrollerReducer,
    rootFolder: rootFolderReducer,
    selectedFolder: selectedFolderReducer,
  });
}
