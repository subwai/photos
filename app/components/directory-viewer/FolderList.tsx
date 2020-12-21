import { times } from 'lodash';
import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  listContainer: {
    overflow: 'auto',
  },
});

interface Props {
  height: number;
  rowHeight: number;
  rowCount: number;
  rowRenderer: ({ index }: { index: number }) => any;
  overscanRowCount?: number;
  scroll: number;
}

export default memo(function FolderList({
  height,
  rowHeight,
  rowCount,
  rowRenderer,
  overscanRowCount = 5,
  scroll,
}: Props): JSX.Element {
  const classes = useStyles();

  const currentIndex = Math.floor(scroll / rowHeight);
  const startIndex = Math.max(0, currentIndex - overscanRowCount);
  const endIndex = Math.min(rowCount - 1, currentIndex + Math.ceil(height / rowHeight) + overscanRowCount);
  const itemsToRender = endIndex - startIndex;

  return (
    <div className={classes.listContainer}>
      <div style={{ height: startIndex * rowHeight }} />
      {times(itemsToRender, (i) => rowRenderer({ index: startIndex + i }))}
      <div style={{ height: (rowCount - 1 - endIndex) * rowHeight }} />
    </div>
  );
});
