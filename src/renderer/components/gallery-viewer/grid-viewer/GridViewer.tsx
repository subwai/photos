import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';
import { AutoSizer } from 'react-virtualized';
import { selectSelectedIndex } from '../../../redux/slices/selectedFolderSlice';
import { selectPreview } from '../../../redux/slices/viewerSlice';
import ImageViewer from '../ImageViewer';
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
  const selectedIndex = useSelector(selectSelectedIndex);
  const preview = useSelector(selectPreview);

  return (
    <>
      <div className={classes.container}>
        <AutoSizer>{({ width, height }) => <GridScroller width={width} height={height} />}</AutoSizer>
      </div>
      {selectedIndex !== null && preview && <ImageViewer />}
    </>
  );
}
