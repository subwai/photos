import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { max, orderBy } from 'lodash';
import { Grid } from 'react-virtualized';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet } from 'jss';
import FileEntry, { findAllFilesRecursive } from '../../utils/FileEntry';
import Thumbnail from './Thumbnail';
import useEventListener from '../../utils/useEventListener';
import useAnimation from '../../utils/useAnimation';
import { selectPlaying } from './playerSlice';
import { selectGalleryScrollerHeight, selectGallerySort, setHeight, setSort } from './galleryScrollerSlice';
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
    position: 'relative',
  },
  sortContainer: {
    position: 'absolute',
    top: -15,
    left: 15,
    background: 'rgba(40,40,40,.9)',
    width: 'max-content',
    height: 'max-content',
    border: '1px solid #555',
    zIndex: 1,
    borderRadius: 15,
    padding: '5px 10px',
  },
  sort: {
    background: 'transparent',
    appearance: 'none',
    color: '#ccc',
    border: 0,
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

export default memo(function GalleryScroller({ folder, width }: Props): JSX.Element | null {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const styles = useStyles({ index: selectedIndex });
  const [dragStart, setDragging] = useState<number | null>(null);
  const [flattenedFiles, setFlattenedFiles] = useState<FileEntry[] | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const height = useSelector(selectGalleryScrollerHeight);
  const hiddenFolders = useSelector(selectHiddenFolders);
  const sort = useSelector(selectGallerySort);
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
      setFlattenedFiles(folder ? findAllFilesRecursive(folder, hiddenFolders) : null);
    }, 250);

    return () => clearTimeout(timeout);
  }, [folder, hiddenFolders]);

  const sortedFiles = useMemo(() => {
    return orderBy(flattenedFiles, ...sort.split(':'));
  }, [flattenedFiles, sort]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (sortedFiles && sortedFiles[selectedIndex]) {
        dispatch(setSelectedFile(sortedFiles[selectedIndex]));
      }
    }, 100);
    const rule = sheet?.addRule(`file-${selectedIndex}`, {
      background: 'rgba(255,255,255,.2)',
    });

    return () => {
      if (rule) {
        sheet?.deleteRule(rule.key);
      }
      clearTimeout(timeout);
    };
  }, [sortedFiles, selectedIndex, sheet]);

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
    setSelectedIndex(Math.min(selectedIndex + 1, sortedFiles ? sortedFiles.length - 1 : 0));
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
    if (!sortedFiles) {
      return;
    }

    const position = selectedIndex * height;
    const leftEdge = Math.max(0, position - height);
    const rightEdge = Math.min((sortedFiles.length + 1) * height, position + 2 * height);

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
  }, [selectedIndex, width, height, sortedFiles]);

  useEffect(() => {
    if (scroll.animate && scroll.to === animationScroll) {
      setScroll({ ...scroll, current: scroll.to, animate: false });
    }
  }, [scroll, animationScroll]);

  const onSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSort(event.target.value));
    setSelectedIndex(0);
  };

  const handleScroll = ({ scrollLeft }: { scrollLeft: number }) => {
    if (!scroll.animate) {
      setScroll({ ...scroll, current: scrollLeft });
    }
  };

  const cellRenderer = ({ columnIndex, style }: { columnIndex: number; style: object }) => {
    if (!sortedFiles) {
      return null;
    }
    const file = sortedFiles[columnIndex];

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
      <div className={styles.dragHandle} onMouseDown={startDragging} />
      <div className={styles.sortContainer}>
        <select value={sort} onChange={onSortChange} className={styles.sort}>
          <option value="fullPath:asc">Filename &#11014;</option>
          <option value="fullPath:desc">Filename &#11015;</option>
        </select>
      </div>
      <div className={styles.scrollContainer}>
        <Grid
          cellRenderer={cellRenderer}
          columnWidth={height}
          columnCount={sortedFiles ? sortedFiles.length : 0}
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
});
