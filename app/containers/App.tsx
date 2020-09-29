import React, { ReactNode } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  topBar: {
    height: 34,
    '-webkitAppRegion': 'drag',
  },
});

type Props = {
  children: ReactNode;
};

export default function App(props: Props) {
  const { children } = props;
  const styles = useStyles();
  return (
    <>
      <div className={styles.topBar} />
      {children}
    </>
  );
}
