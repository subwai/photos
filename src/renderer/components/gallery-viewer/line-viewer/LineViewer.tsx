import { max } from 'lodash';
import { useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { AutoSizer } from 'react-virtualized';
import { useDebounce } from 'use-debounce';
import useAutomaticChildrenLoader from '../../../hooks/useAutomaticChildrenLoader';
import useDragging from '../../../hooks/useDragging';
import useSelectedFolder from '../../../hooks/useSelectedFolder';
import type { FileEntryModel } from '../../../models/FileEntry';
import { selectGalleryScrollerHeight, setHeight } from '../../../redux/slices/galleryViewerSlice';
import ImageViewer from '../ImageViewer';
import GalleryScroller from './LineScroller';
import { THUMBNAIL_PADDING } from './Thumbnail';

const useStyles = createUseStyles({
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
    background: 'linear-gradient(45deg, rgb(35, 35, 35) 10%, rgb(26, 26, 26))',
  },
  galleryContainer: {
    background: 'rgba(0,0,0,.3)',
    whiteSpace: 'nowrap',
  },
  dragHandle: {
    width: '100%',
    height: 1,
    background: '#555',
    zIndex: 1,
    position: 'absolute',
    top: 0,
    '&:after': {
      content: '""',
      height: 9,
      width: '100%',
      position: 'absolute',
      top: 0,
      bottom: 0,
      marginTop: -4,
      backgroundColor: 'transparent',
      cursor: 'ns-resize',
      zIndex: 2,
    },
  },
});

export default function LineViewer() {
  const classes = useStyles();
  const container = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<HTMLDivElement>(null);
  const [selectedFolder] = useSelectedFolder();
  const height = useSelector(selectGalleryScrollerHeight);
  const dispatch = useDispatch();

  useAutomaticChildrenLoader(selectedFolder, { deep: true });

  useDragging(
    dragHandle,
    ({ y }) => {
      if (!container.current) {
        return;
      }

      const newHeight = max([0, height - y]) || 0;
      container.current.style.height = `${newHeight}px`;
    },
    () => {},
    ({ y }) => {
      const newHeight = max([0, height - y]) || 0;
      dispatch(setHeight(Math.round(newHeight - THUMBNAIL_PADDING * 2)));
    }
  );

  return (
    <>
      <div className={classes.imageContainer}>
        <ImageViewer />
      </div>
      <div ref={container} className={classes.galleryContainer} style={{ height }}>
        <div className={classes.dragHandle} ref={dragHandle} />
        <AutoSizer disableHeight style={{ width: '100%' }}>
          {({ width }) => <GalleryScrollerWrapper folder={selectedFolder} width={width} height={height} />}
        </AutoSizer>
      </div>
    </>
  );
}

interface GalleryScrollerWrapperProps {
  folder: FileEntryModel | null;
  width: number;
  height: number;
}

const GalleryScrollerWrapper = ({ folder, width, height }: GalleryScrollerWrapperProps) => {
  const [debouncedWidth] = useDebounce(width, 1000);

  return <GalleryScroller key={folder?.fullPath} folder={folder} width={debouncedWidth} height={height} />;
};
