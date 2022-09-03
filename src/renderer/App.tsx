import { ConnectedRouter } from 'connected-react-router';
import { createUseStyles } from 'react-jss';
import { Provider } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import TopBar from './components/TopBar';
import { loadPersistedState, persistState } from './redux/persistStoreState';
import { configuredStore, history } from './redux/store';

const aero = window.electron.platform === 'win32';

const useStyles = createUseStyles({
  '@global': {
    body: {
      background: aero ? 'rgba(66,66,66,.5)' : 'transparent',
    },
  },
});

const store = configuredStore(loadPersistedState());

if (store.getState().rootFolder.path) {
  window.electron.setRootFolder(store.getState().rootFolder.path);
}

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
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </ConnectedRouter>
      </Provider>
    </>
  );
}
