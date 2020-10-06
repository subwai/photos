import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { max } from 'lodash';
import { Grid } from 'react-virtualized';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet } from 'jss';
import FileEntry, { findAllFilesRecursive } from '../../utils/FileEntry';
import Thumbnail from './Thumbnail';
import useEventListener from '../../utils/useEventListener';
import useAnimation from '../../utils/useAnimation';
import { selectPlaying } from './playerSlice';
import { selectGalleryScrollerHeight, setHeight } from './galleryScrollerSlice';
import { selectHiddenFolders } from '../folderVisibilitySlice';
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
    padding: 6,
    boxSizing: 'border-box',
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

interface Props {
  folder?: FileEntry | null;
  width: number;
}

export default function GalleryScroller({ folder, width }: Props): JSX.Element | null {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const styles = useStyles({ index: selectedIndex });
  const [dragStart, setDragging] = useState<number | null>(null);
  const [files, setFiles] = useState<FileEntry[] | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const height = useSelector(selectGalleryScrollerHeight);
  const hiddenFolders = useSelector(selectHiddenFolders);
  const dispatch = useDispatch();

  const [sheet, setSheet] = useState<StyleSheet<string> | null>();

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);

    return () => {
      jss.removeStyleSheet(x);
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFiles(folder ? findAllFilesRecursive(folder, hiddenFolders) : null);
    }, 250);

    return () => clearTimeout(timeout);
  }, [folder, hiddenFolders]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setSelectedFile((files && files[selectedIndex]) || null));
    }, 250);
    const rule = sheet?.addRule(`file-${selectedIndex}`, {
      background: 'rgba(255,255,255,.1)',
    });

    return () => {
      if (rule) {
        sheet?.deleteRule(rule.key);
      }
      clearTimeout(timeout);
    };
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
      dispatch(setHeight(Math.round(newHeight - 12)));
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
    const rightEdge = Math.min((files.length + 1) * height, position + 2 * height);

    const leftDiff = Math.abs(leftEdge - currentScroll);
    const rightDiff = Math.abs(rightEdge - (currentScroll + width));

    if (currentScroll < position && position + height < currentScroll + width) {
      return;
    }

    if (leftDiff < rightDiff) {
      setScroll({ ...scroll, from: currentScroll, to: leftEdge, animate: true });
    } else {
      setScroll({ ...scroll, from: currentScroll, to: rightEdge - width, animate: true });
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
        index={columnIndex}
        fileEntry={file}
        onClick={() => {
          setSelectedIndex(columnIndex);
        }}
        style={style}
      />
    );
  };

  return (
    <div ref={container} className={styles.galleryContainer} style={{ height: height + 12 }}>
      <style>
        {`.${styles.galleryContainer} .file-${selectedIndex}: {
        background: rgba(255,255,255,.1);
        }`}
      </style>
      <div className={styles.dragHandle} onMouseDown={startDragging} />
      <div className={styles.scrollContainer}>
        <Grid
          cellRenderer={cellRenderer}
          columnWidth={height}
          columnCount={files ? files.length : 0}
          rowHeight={height}
          rowCount={1}
          height={height}
          width={width - 12}
          overscanColumnCount={5}
          scrollLeft={scroll.animate ? animationScroll : undefined}
          onScroll={handleScroll}
        />
      </div>
    </div>
  );
}
