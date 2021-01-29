import React from 'react';
import { render } from 'react-dom';
import './utils/configure-bluebird';
import App from './renderer/App';

render(<App />, document.getElementById('root'));
