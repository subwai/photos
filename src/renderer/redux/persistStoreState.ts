import { debounce } from 'lodash';
import type { RootState } from './store';

const persistStateRaw = (state: RootState) => {
  try {
    const clone = {
      folderVisibility: state.folderVisibility,
      galleryScroller: state.galleryScroller,
      rootFolder: {
        path: state.rootFolder.path,
      },
    };
    localStorage.setItem('state', JSON.stringify(clone));
  } catch (err) {
    console.error(err);
  }
};

export const persistState = debounce(persistStateRaw, 1000);

export const loadPersistedState = () => {
  try {
    const serializedState = localStorage.getItem('state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return undefined;
  }
};
