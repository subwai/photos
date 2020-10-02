import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { max } from 'lodash';
import { Grid } from 'react-virtualized';
import { useDispatch, useSelector } from 'react-redux';
import FileEntry, { findAllFilesRecursive } from '../../utils/FileEntry';
import Thumbnail from './Thumbnail';
import useEventListener from '../../utils/useEventListener';
import useAnimation from '../../utils/useAnimation';
import { selectPlaying } from './playerSlice';
import { selectGalleryScrollerHeight, setHeight } from './galleryScrollerSlice';
import { selectHiddenFolders } from '../hiddenFoldersSlice';
import { setSelectedFile } from '../selectedFolderSlice';

const useStyles = createUseStyles({
  galleryContainer: {
    background: 'rgba(0,0,0,.3)',
    overflowX: 'scroll',
    whiteSpace: 'nowrap',
  },
  scrollContainer: {
    width: '100%',
    height: '100%',
  },
  dragHandle: {
    width: '100%',
    height: 1,
    background: '#444',
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

interface Props {
  folder?: FileEntry | null;
  width: number;
}

export default function GalleryScroller({ folder, width }: Props): JSX.Element | null {
  const styles = useStyles();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dragStart, setDragging] = useState<number | null>(null);
  const [files, setFiles] = useState<FileEntry[] | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const height = useSelector(selectGalleryScrollerHeight);
  const hiddenFolders = useSelector(selectHiddenFolders);
  const dispatch = useDispatch();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFiles(folder ? findAllFilesRecursive(folder, hiddenFolders) : null);
    }, 250);

    return () => clearTimeout(timeout);
  }, [folder, hiddenFolders]);

  useEffect(() => {
    dispatch(setSelectedFile((files && files[selectedIndex]) || null));
  }, [files, selectedIndex]);

  const startDragging = (event: React.MouseEvent) => {
    event.preventDefault();
    setDragging(event.pageY);
  };

  useEventListener(
    'pointermove',
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (container.current === null || dragStart === null) {
        return;
      }

      const newHeight = max([0, height + dragStart - event.pageY]) || 0;
      container.current.style.height = `${newHeight}px`;
    },
    window,
    dragStart !== null
  );

  useEventListener(
    'pointerup',
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (dragStart === null) {
        return;
      }

      const newHeight = max([0, height + dragStart - event.pageY]) || 0;
      setDragging(null);
      dispatch(setHeight(newHeight));
    },
    window,
    dragStart !== null
  );

  const playing = useSelector(selectPlaying);

  const arrowLeft = (event: React.KeyboardEvent) => {
    event.preventDefault();
    setSelectedIndex(Math.max(selectedIndex - 1, 0));
  };

  const arrowRight = (event: React.KeyboardEvent) => {
    event.preventDefault();
    setSelectedIndex(Math.min(selectedIndex + 1, files ? files.length - 1 : 0));
  };

  useEventListener(
    'keydown',
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          return !event.shiftKey && arrowLeft(event);
        case 'ArrowRight':
          return !event.shiftKey && arrowRight(event);
        default:
          return false;
      }
    },
    window,
    !playing
  );

  const [scroll, setScroll] = useState<{ current: number; from: number; to: number; animate: boolean }>({
    current: 0,
    from: 0,
    to: 0,
    animate: false,
  });

  useEffect(() => {
    setScroll({ current: 0, from: 0, to: 0, animate: false });
  }, [folder]);

  const animationScroll = useAnimation('linear', scroll.from, scroll.to, 200);
  const currentScroll = scroll.animate ? animationScroll : scroll.current;

  useEffect(() => {
    if (!files) {
      return;
    }

    const position = selectedIndex * height;
    const leftEdge = Math.max(0, position - height);
    const rightEdge = Math.min(files.length * height, position + height * 2);

    if (leftEdge < currentScroll) {
      setScroll({ ...scroll, from: Math.round(currentScroll), to: Math.max(0, leftEdge), animate: true });
    }
    if (rightEdge > currentScroll + width && width !== 0) {
      setScroll({ ...scroll, from: Math.round(currentScroll), to: Math.max(0, rightEdge - width), animate: true });
    }
  }, [selectedIndex, width, height, files]);

  useEffect(() => {
    if (scroll.animate && scroll.to === animationScroll) {
      setScroll({ ...scroll, current: scroll.to, animate: false });
    }
  }, [scroll, animationScroll]);

  const handleScroll = ({ scrollLeft }: { scrollLeft: number }) => {
    if (!scroll.animate) {
      setScroll({ ...scroll, current: scrollLeft });
    }
  };

  const cellRenderer = ({ columnIndex, style }: { columnIndex: number; style: object }) => {
    if (!files) {
      return null;
    }
    const file = files[columnIndex];

    return (
      <Thumbnail
        key={file.fullPath}
        fileEntry={file}
        isSelected={selectedIndex === columnIndex}
        onClick={() => {
          setSelectedIndex(columnIndex);
        }}
        style={style}
      />
    );
  };

  return (
    <div ref={container} className={styles.galleryContainer} style={{ height }}>
      <div className={styles.dragHandle} onMouseDown={startDragging} />
      <div className={styles.scrollContainer}>
        <Grid
          cellRenderer={cellRenderer}
          columnWidth={height}
          columnCount={files ? files.length : 0}
          rowHeight={height}
          rowCount={1}
          height={height}
          width={width}
          overscanColumnCount={10}
          scrollLeft={scroll.animate ? animationScroll : undefined}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
}
