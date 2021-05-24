import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';
import { selectGalleryViewer } from '../../redux/slices/galleryViewerSlice';
import GridViewer from './grid-viewer/GridViewer';
import LineViewer from './line-viewer/LineViewer';
import MetaBar from './MetaBar';

const useStyles = createUseStyles({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
});

export default memo(function GalleryViewer(): JSX.Element {
  const viewer = useSelector(selectGalleryViewer);
  const classes = useStyles();

  return (
    <div className={classes.container}>
      {viewer === 'grid' && <GridViewer />}
      {viewer === 'line' && <LineViewer />}
      <MetaBar />
    </div>
  );
});
