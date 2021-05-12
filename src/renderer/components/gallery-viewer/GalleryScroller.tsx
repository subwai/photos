import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { orderBy, throttle } from 'lodash';
import { Grid } from 'react-virtualized';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet } from 'jss';
import uuid from 'uuid';
import { FileEntryModel, findAllFilesRecursive } from '../../models/FileEntry';
import Thumbnail from './Thumbnail';
import useEventListener from '../../hooks/useEventListener';
import useAnimation from '../../hooks/useAnimation';
import { selectPlaying } from '../../redux/slices/playerSlice';
import { selectGallerySort } from '../../redux/slices/galleryScrollerSlice';
import { selectHiddenFolders } from '../../redux/slices/folderVisibilitySlice';
import { selectSelectedFile, setSelectedFile } from '../../redux/slices/selectedFolderSlice';
import useFileEventListener from '../../hooks/useFileEventListener';

const useStyles = createUseStyles({
  scrollContainer: {
    width: '100%',
    height: '100%',
    padding: '0 6px',
    boxSizing: 'border-box',
    position: 'relative',
  },
  grid: {
    overflowX: 'overlay!important',
    overflowY: 'hidden!important',
  },
  count: {
    position: 'absolute',
    right: 2,
    bottom: 5,
  },
});

interface Props {
  folder: FileEntryModel | null;
  width: number;
  height: number;
}

interface Scroll {
  value: number;
  from: number;
  to: number;
  animated: number;
}

export default memo(function GalleryScroller({ folder, width, height }: Props): JSX.Element | null {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const classes = useStyles();
  const [flattenedFiles, setFlattenedFiles] = useState<FileEntryModel[] | null>(null);
  const hiddenFolders = useSelector(selectHiddenFolders);
  const selectedFile = useSelector(selectSelectedFile);
  const sort = useSelector(selectGallerySort);
  const scroll = useRef<Scroll>({ value: 0, from: 0, to: 0, animated: 0 });
  const [animateTo, setAnimateTo] = useState(0);
  const dispatch = useDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const [update, triggerUpdate] = useState<string | null>(null);

  const triggerUpdateThrottled = useMemo(() => throttle(() => triggerUpdate(uuid.v4()), 2000), [triggerUpdate]);
  useFileEventListener('all', triggerUpdateThrottled, folder);

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);

    return () => {
      jss.removeStyleSheet(x);
    };
  }, []);

  const updateFlattenedFiles = () => {
    setFlattenedFiles(folder ? (findAllFilesRecursive(folder, hiddenFolders) as FileEntryModel[]) : null);
  };

  useEffect(() => {
    const timeout = setTimeout(updateFlattenedFiles, 250);

    return () => clearTimeout(timeout);
  }, [folder, hiddenFolders]);

  const calculateAllFilesRecursiveThrottled = useMemo(() => throttle(updateFlattenedFiles, 2000), [setFlattenedFiles]);
  useEffect(calculateAllFilesRecursiveThrottled, [update]);

  const sortedFiles = useMemo(() => {
    return orderBy(flattenedFiles, ...sort.split(':'));
  }, [flattenedFiles, sort]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [sort]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (sortedFiles && sortedFiles[selectedIndex] && sortedFiles[selectedIndex] !== selectedFile) {
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
  }, [sortedFiles, selectedIndex, sheet, dispatch]);

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

  const firstChild = ref.current?.firstChild as HTMLElement;

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
    ref.current
  );

  useEffect(() => {
    if (!sortedFiles) {
      return;
    }

    const position = selectedIndex * height;
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
  }, [selectedIndex, sortedFiles]);

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
        onClick={() => {
          setSelectedIndex(columnIndex);
        }}
        style={style}
      />
    );
  };

  return (
    <div ref={ref} className={classes.scrollContainer}>
      <Grid
        className={classes.grid}
        cellRenderer={cellRenderer}
        columnWidth={height}
        columnCount={sortedFiles ? sortedFiles.length : 0}
        rowHeight={height - 10}
        rowCount={1}
        height={height}
        width={width - 12}
        overscanColumnCount={5}
        scrollLeft={isAnimating ? scroll.current.value : undefined}
        onScroll={handleScroll}
      />
      <div className={classes.count}>{sortedFiles ? sortedFiles.length : 0}</div>
    </div>
  );
});
