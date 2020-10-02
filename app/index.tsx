import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import './utils/configure-bluebird';
import { history, configuredStore } from './store';
import './app.global.css';
import { loadPersistedState, persistState } from './utils/persistStoreState';

const store = configuredStore(loadPersistedState());

store.subscribe(() => {
  persistState(store.getState());
});

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => {
  // eslint-disable-next-line global-require
  const Root = require('./containers/Root').default;
  render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    document.getElementById('root')
  );
});
