/* eslint-disable import/no-cycle */
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import playerReducer from './slices/playerSlice';
import galleryScrollerReducer from './slices/galleryScrollerSlice';
import folderVisibilityReducer from './slices/folderVisibilitySlice';
import rootFolderReducer from './slices/rootFolderSlice';
import selectedFolderReducer from './slices/selectedFolderSlice';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    player: playerReducer,
    folderVisibility: folderVisibilityReducer,
    galleryScroller: galleryScrollerReducer,
    rootFolder: rootFolderReducer,
    selectedFolder: selectedFolderReducer,
  });
}
