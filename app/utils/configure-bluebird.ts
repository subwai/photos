import Bluebird from 'bluebird';

Bluebird.config({
  cancellation: true,
  warnings: {
    wForgottenReturn: false,
  },
});
