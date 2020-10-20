import { ipcRenderer } from 'electron';
import React, { ReactNode } from 'react';
import { createUseStyles } from 'react-jss';

const aero = process.platform === 'win32';

const useStyles = createUseStyles({
  topBar: {
    height: 34,
    '-webkitAppRegion': 'drag',
  },
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
  const styles = useStyles();

  function maximizeWindow() {
    ipcRenderer.invoke('maximize').catch(console.error);
  }

  return (
    <>
      <div className={styles.topBar} onDoubleClick={maximizeWindow} />
      {children}
    </>
  );
}
