import { orderBy } from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, GridCellProps } from 'react-virtualized';
import { selectGallerySort, setFilesCount } from '../../../redux/slices/galleryViewerSlice';
import { selectSelectedFolder } from '../../../redux/slices/selectedFolderSlice';
import Thumbnail from './GridThumbnail';
import { THUMBNAIL_HEIGHT, THUMBNAIL_SIZE } from './GridFolderThumbnail';

const useStyles = createUseStyles({
  grid: {},
});

type Props = {
  width: number;
  height: number;
};

export default function GridScroller({ width, height }: Props) {
  const selectedFolder = useSelector(selectSelectedFolder);
  const sort = useSelector(selectGallerySort);
  const dispatch = useDispatch();
  const classes = useStyles();

  const sortedFiles = useMemo(
    () => orderBy(selectedFolder?.children || [], ...sort.split(':')),
    [selectedFolder, sort]
  );

  useEffect(() => {
    dispatch(setFilesCount(sortedFiles.length));
  }, [sortedFiles]);

  const columnCount = Math.floor(width / THUMBNAIL_HEIGHT);
  const rowCount = Math.ceil((selectedFolder?.children?.length || 0) / columnCount);

  const cellRenderer = ({ columnIndex, rowIndex, style }: GridCellProps) => {
    const file = sortedFiles[rowIndex * columnCount + columnIndex];
    if (!file) {
      return null;
    }

    return (
      <Thumbnail key={file.fullPath} index={rowIndex * columnIndex} fileEntry={file} onClick={() => {}} style={style} />
    );
  };

  return (
    <Grid
      className={classes.grid}
      cellRenderer={cellRenderer}
      columnWidth={THUMBNAIL_HEIGHT}
      columnCount={columnCount}
      rowHeight={THUMBNAIL_SIZE}
      rowCount={rowCount}
      height={height}
      width={width}
      overscanRowCount={5}
    />
  );
}
