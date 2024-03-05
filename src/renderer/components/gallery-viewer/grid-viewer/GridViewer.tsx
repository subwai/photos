import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';
import { AutoSizer } from 'react-virtualized';

import ImageViewer from 'renderer/components/gallery-viewer/ImageViewer';
import GridScroller from 'renderer/components/gallery-viewer/grid-viewer/GridScroller';
import { selectSelectedIndex } from 'renderer/redux/slices/selectedFolderSlice';
import { selectPreview } from 'renderer/redux/slices/viewerSlice';

const useStyles = createUseStyles({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
});

export default function GridViewer({ search }: { search: string }) {
  const classes = useStyles();
  const selectedIndex = useSelector(selectSelectedIndex);
  const preview = useSelector(selectPreview);

  return (
    <>
      <div className={classes.container}>
        <AutoSizer>{({ width, height }) => <GridScroller width={width} height={height} search={search} />}</AutoSizer>
      </div>
      {selectedIndex !== null && preview && <ImageViewer />}
    </>
  );
}
