import { memo, useState } from 'react';
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
  const [search, setSearch] = useState('');

  return (
    <div className={classes.container}>
      <MetaBar search={search} onSearch={setSearch} />
      {viewer === 'grid' && <GridViewer search={search} />}
      {viewer === 'line' && <LineViewer search={search} />}
    </div>
  );
});
