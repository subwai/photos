import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { createUseStyles } from 'react-jss';

import './App.global.css';
import TopBar from './components/TopBar';
import Home from './components/Home';

const aero = process.platform === 'win32';

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
    <>
      <TopBar />
      <Router>
        <Switch>
          <Route path="/" component={Home} />
        </Switch>
      </Router>
    </>
  );
}

