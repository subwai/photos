import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { createUseStyles } from 'react-jss';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';

import './App.global.css';
import TopBar from './components/TopBar';
import Home from './components/Home';
import { history, configuredStore } from './redux/store';
import { loadPersistedState, persistState } from './redux/persistStoreState';

const aero = process.platform === 'win32';

const useStyles = createUseStyles({
  '@global': {
    body: {
      background: aero ? 'rgba(66,66,66,.5)' : 'transparent',
    },
  },
});

const store = configuredStore(loadPersistedState());

store.subscribe(() => {
  persistState(store.getState());
});

export default function App() {
  useStyles();

  return (
    <>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <TopBar />
          <Switch>
            <Route path="/" component={Home} />
          </Switch>
        </ConnectedRouter>
      </Provider>
    </>
  );
}
