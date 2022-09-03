import type { RouterState } from 'redux-first-history';
import { combineReducers, Reducer } from 'redux';
import folderVisibilityReducer from './slices/folderVisibilitySlice';
import galleryScrollerReducer from './slices/galleryViewerSlice';
import viewerReducer from './slices/viewerSlice';
import rootFolderReducer from './slices/rootFolderSlice';
import selectedFolderReducer from './slices/selectedFolderSlice';

export default function createRootReducer(routerReducer: Reducer<RouterState>) {
  return combineReducers({
    router: routerReducer,
    viewer: viewerReducer,
    folderVisibility: folderVisibilityReducer,
    galleryScroller: galleryScrollerReducer,
    rootFolder: rootFolderReducer,
    selectedFolder: selectedFolderReducer,
  });
}
