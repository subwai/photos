import { Middleware, configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';

import { loadPersistedState, persistState } from 'renderer/redux/persistStoreState';
import createRootReducer from 'renderer/redux/rootReducer';

const rootReducer = createRootReducer();

const middleware: Middleware[] = [];
const excludeLoggerEnvs = ['test', 'production'];
const shouldIncludeLogger = !excludeLoggerEnvs.includes(process.env.NODE_ENV || '');

if (shouldIncludeLogger) {
  middleware.push(
    createLogger({
      level: 'info',
      collapsed: true,
    }),
  );
}
// Create Store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }).concat(...middleware),
  preloadedState: loadPersistedState(),
  devTools: false,
  // devTools: {
  //   stateSanitizer: (state: RootState) => ({
  //     ...state,
  //     rootFolder: { ...state.rootFolder, folder: '<object>' },
  //     selectedFolder: { ...state.selectedFolder, file: '<object>' },
  //   }),
  // },
});

export type RootState = ReturnType<typeof rootReducer>;

store.subscribe(() => persistState(store.getState()));

if (store.getState().rootFolder.path) {
  window.electron.setRootFolder(store.getState().rootFolder.path);
}

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept(
    './rootReducer',
    // eslint-disable-next-line global-require
    () => store.replaceReducer(require('./rootReducer').default),
  );
}
