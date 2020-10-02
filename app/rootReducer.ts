/* eslint-disable import/no-cycle */
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import playerReducer from './features/gallery-viewer/playerSlice';
import galleryScrollerReducer from './features/gallery-viewer/galleryScrollerSlice';
import hiddenFoldersReducer from './features/hiddenFoldersSlice';
import rootFolderReducer from './features/rootFolderSlice';
import selectedFolderReducer from './features/selectedFolderSlice';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    player: playerReducer,
    galleryScroller: galleryScrollerReducer,
    hiddenFolders: hiddenFoldersReducer,
    rootFolder: rootFolderReducer,
    selectedFolder: selectedFolderReducer,
  });
}
