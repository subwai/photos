import { memo } from 'react';
import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';

import MetaBar from 'renderer/components/gallery-viewer/MetaBar';
import GridViewer from 'renderer/components/gallery-viewer/grid-viewer/GridViewer';
import LineViewer from 'renderer/components/gallery-viewer/line-viewer/LineViewer';
import { selectGalleryViewer } from 'renderer/redux/slices/galleryViewerSlice';

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
      <MetaBar />
      {viewer === 'grid' && <GridViewer />}
      {viewer === 'line' && <LineViewer />}
    </div>
  );
});
