import React from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';
import GridScroller from './GridScroller';

const useStyles = createUseStyles({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
});

export default function GridViewer() {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <AutoSizer>{({ width, height }) => <GridScroller width={width} height={height} />}</AutoSizer>
    </div>
  );
}
