import type { RouterState } from 'redux-first-history';
import { combineReducers, Reducer } from 'redux';
import folderVisibilityReducer from 'renderer/redux/slices/folderVisibilitySlice';
import galleryScrollerReducer from 'renderer/redux/slices/galleryViewerSlice';
import viewerReducer from 'renderer/redux/slices/viewerSlice';
import rootFolderReducer from 'renderer/redux/slices/rootFolderSlice';
import selectedFolderReducer from 'renderer/redux/slices/selectedFolderSlice';

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
