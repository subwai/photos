/* eslint-disable import/no-cycle */
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import playerReducer from './features/gallery-viewer/playerSlice';
import currentFolderReducer from './features/gallery-viewer/currentFolderSlice';
import galleryScrollerReducer from './features/gallery-viewer/galleryScrollerSlice';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    player: playerReducer,
    currentFolder: currentFolderReducer,
    galleryScroller: galleryScrollerReducer,
  });
}
