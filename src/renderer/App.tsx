import { createUseStyles } from 'react-jss';
import { Provider } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import 'renderer/App.css';
import HistoryRouter from 'renderer/components/HistoryRouter';
import Home from 'renderer/components/Home';
import TopBar from 'renderer/components/TopBar';
import { history, store } from 'renderer/redux/store';

const aero = window.electron.platform === 'win32';

const useStyles = createUseStyles({
  '@global': {
    body: {
      background: aero ? 'rgba(66,66,66,.5)' : 'transparent',
    },
  },
});

export default function App() {
  useStyles();

  return (
    <Provider store={store}>
      <HistoryRouter history={history}>
        <TopBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path=":query" element={<Home />} />
        </Routes>
      </HistoryRouter>
    </Provider>
  );
}
