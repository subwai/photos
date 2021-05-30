import { StyleSheet } from 'jss';
import { orderBy } from 'lodash';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { Grid } from 'react-virtualized';
import { useDebouncedCallback, useThrottledCallback } from 'use-debounce';
import { v4 as uuid4 } from 'uuid';
import useAnimation from '../../../hooks/useAnimation';
import useEventListener from '../../../hooks/useEventListener';
import useFileEventListener from '../../../hooks/useFileEventListener';
import useSelectedIndex from '../../../hooks/useSelectedIndex';
import { FileEntryModel, findAllFilesRecursive } from '../../../models/FileEntry';
import { selectHiddenFolders } from '../../../redux/slices/folderVisibilitySlice';
import { selectGallerySort, setFilesCount } from '../../../redux/slices/galleryViewerSlice';
import { selectSelectedFile, setSelectedFile } from '../../../redux/slices/selectedFolderSlice';
import { selectPlaying } from '../../../redux/slices/viewerSlice';
import Thumbnail from './Thumbnail';

const useStyles = createUseStyles({
  scrollContainer: {
    width: '100%',
    height: '100%',
    padding: '0 6px 2px',
    boxSizing: 'border-box',
    position: 'relative',
  },
  grid: {
    overflowX: 'overlay!important',
    overflowY: 'hidden!important',
  },
});

interface Props {
  folder: FileEntryModel | null;
  width: number;
  height: number;
}

interface ScrollValues {
  value: number;
  from: number;
  to: number;
  animated: number;
}

export default memo(function LineScroller({ folder, width, height }: Props): JSX.Element | null {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [flattenedFiles, setFlattenedFiles] = useState<FileEntryModel[] | null>(null);
  const hiddenFolders = useSelector(selectHiddenFolders);
  const selectedFile = useSelector(selectSelectedFile);
  const [selectedIndex, setSelectedIndex] = useSelectedIndex();
  const sort = useSelector(selectGallerySort);
  const scroll = useRef<ScrollValues>({ value: 0, from: 0, to: 0, animated: 0 });
  const container = useRef<HTMLDivElement>(null);
  const [animateTo, setAnimateTo] = useState(0);
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const [update, triggerUpdate] = useState<string | null>(null);

  const updateFlattenedFiles = () => {
    setFlattenedFiles(folder ? (findAllFilesRecursive(folder, hiddenFolders) as FileEntryModel[]) : null);
  };
  const updateFlattenedFilesDebounced = useDebouncedCallback(updateFlattenedFiles, 250);
  const calculateAllFilesRecursiveThrottled = useThrottledCallback(updateFlattenedFiles, 2000);
  const triggerUpdateThrottled = useThrottledCallback(() => triggerUpdate(uuid4()), 2000);
  const sortedFiles = useMemo(() => orderBy(flattenedFiles, ...sort.split(':')), [flattenedFiles, sort]);

  useEffect(updateFlattenedFilesDebounced, [folder, hiddenFolders]);
  useEffect(calculateAllFilesRecursiveThrottled, [update]);
  useFileEventListener('all', triggerUpdateThrottled, folder);

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);

    return () => {
      jss.removeStyleSheet(x);
      updateFlattenedFilesDebounced.flush();
    };
  }, []);

  useEffect(() => {
    dispatch(setFilesCount(sortedFiles.length));
    setSelectedFileByIndexDebounced(selectedIndex);
  }, [sortedFiles]);

  const setSelectedFileByIndexDebounced = useDebouncedCallback(
    (nextIndex: number | null) => {
      const nextFile = sortedFiles && nextIndex !== null ? sortedFiles[nextIndex] : null;
      if (nextFile !== selectedFile) {
        dispatch(setSelectedFile(nextFile));
      }
    },
    100,
    { leading: true }
  );

  useEffect(() => {
    setSelectedFileByIndexDebounced(selectedIndex);
    const rule = sheet?.addRule(`file-${selectedIndex}`, {
      background: 'rgba(255,255,255,.2)',
    });

    return () => {
      if (rule) {
        sheet?.deleteRule(rule.key);
      }
    };
  }, [selectedIndex, sheet]);

  const playing = useSelector(selectPlaying);

  const maybeScrollAnimate = (nextSelectedIndex: number) => {
    if (!sortedFiles) {
      return;
    }

    const position = nextSelectedIndex * height;
    const leftEdge = Math.max(0, position - height);
    const rightEdge = Math.min((sortedFiles.length + 1) * height, position + 2 * height);

    const leftDiff = Math.abs(leftEdge - scroll.current.value);
    const rightDiff = Math.abs(rightEdge - (scroll.current.value + width));

    if (scroll.current.value < position && position + height < scroll.current.value + width) {
      return;
    }

    scroll.current.from = scroll.current.value;
    scroll.current.to = leftDiff < rightDiff ? leftEdge : rightEdge - width;
    setAnimateTo(scroll.current.to);
  };

  const arrowLeft = (event: React.KeyboardEvent) => {
    event.preventDefault();
    const nextSelectedIndex = Math.max((selectedIndex === null ? sortedFiles.length : selectedIndex) - 1, 0);
    setSelectedIndex(nextSelectedIndex);
    maybeScrollAnimate(nextSelectedIndex);
  };

  const arrowRight = (event: React.KeyboardEvent) => {
    event.preventDefault();
    const nextSelectedIndex = Math.min(
      selectedIndex === null ? 0 : selectedIndex + 1,
      sortedFiles ? sortedFiles.length - 1 : 0
    );
    setSelectedIndex(nextSelectedIndex);
    maybeScrollAnimate(nextSelectedIndex);
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

  useEffect(() => {
    scroll.current = {
      value: 0,
      from: 0,
      to: 0,
      animated: 0,
    };
    setAnimateTo(0);
  }, [folder]);

  scroll.current.animated = useAnimation('linear', scroll.current.from, animateTo, 200);
  const isAnimating = scroll.current.animated !== animateTo;
  scroll.current.value = isAnimating ? scroll.current.animated : scroll.current.value;

  const firstChild = container.current?.firstChild as HTMLElement;

  const scrollTo = (x: number) => {
    const newEvent = new Event('scroll', { bubbles: true });
    firstChild?.dispatchEvent(newEvent);
    if (firstChild) {
      firstChild.scrollLeft = Math.max(0, x);
    }
  };

  useEventListener(
    'wheel',
    (event: WheelEvent) => {
      if (event.deltaY !== 0) {
        scrollTo(firstChild?.scrollLeft + event.deltaY);
      }
    },
    container.current
  );

  const handleScroll = ({ scrollLeft }: { scrollLeft: number }) => {
    if (!isAnimating) {
      scroll.current.value = scrollLeft;
      scroll.current.to = scrollLeft;
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
        onClick={() => setSelectedIndex(columnIndex)}
        style={style}
      />
    );
  };

  return (
    <div ref={container} className={classes.scrollContainer}>
      <Grid
        className={classes.grid}
        cellRenderer={cellRenderer}
        columnWidth={height}
        columnCount={sortedFiles ? sortedFiles.length : 0}
        rowHeight={height - 10 - 2}
        rowCount={1}
        height={height - 2}
        width={width - 12}
        overscanColumnCount={5}
        scrollLeft={isAnimating ? scroll.current.value : undefined}
        onScroll={handleScroll}
      />
    </div>
  );
});
