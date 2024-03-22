import { createUseStyles } from 'react-jss';
import { Provider } from 'react-redux';
import { Route, RouterProvider, createMemoryRouter, createRoutesFromElements } from 'react-router-dom';

import 'renderer/App.css';
import Home from 'renderer/components/Home';
import TopBar from 'renderer/components/TopBar';
import { store } from 'renderer/redux/store';

const isWindows = window.electron.platform === 'win32';

const useStyles = createUseStyles({
  '@global': {
    body: {
      background: isWindows ? '#202020' : 'transparent',
    },
  },
});

const router = createMemoryRouter(
  createRoutesFromElements(
    <Route path="/" element={<Home />}>
      <Route path=":query" element={<Home />} />
    </Route>,
  ),
);

export default function App() {
  useStyles();

  return (
    <Provider store={store}>
      <TopBar />
      <RouterProvider router={router} />
    </Provider>
  );
}
