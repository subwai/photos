import Bluebird from 'bluebird';

Bluebird.config({
  cancellation: true,
  longStackTraces: false,
  warnings: {
    wForgottenReturn: false,
  },
});
