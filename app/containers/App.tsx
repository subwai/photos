import React, { ReactNode } from 'react';
import { createUseStyles } from 'react-jss';
import TopBar from '../components/TopBar';

const aero = process.platform === 'win32';

const useStyles = createUseStyles({
  '@global': {
    body: {
      background: aero ? 'rgba(66,66,66,.5)' : 'transparent',
    },
  },
});

type Props = {
  children: ReactNode;
};

export default function App(props: Props) {
  const { children } = props;
  useStyles();

  return (
    <>
      <TopBar />
      {children}
    </>
  );
}
