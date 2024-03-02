import type { StyleSheet } from 'jss';
import { orderBy, size, some, values } from 'lodash';
import natsort from 'natsort';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, GridCellProps } from 'react-virtualized';
import { useDebouncedCallback } from 'use-debounce';

import { THUMBNAIL_HEIGHT, THUMBNAIL_SIZE } from 'renderer/components/gallery-viewer/grid-viewer/GridFolderThumbnail';
import GridThumbnail from 'renderer/components/gallery-viewer/grid-viewer/GridThumbnail';
import useAutomaticChildrenLoader from 'renderer/hooks/useAutomaticChildrenLoader';
import useEventListener from 'renderer/hooks/useEventListener';
import { FileEntryModel } from 'renderer/models/FileEntry';
import { selectGallerySort } from 'renderer/redux/slices/galleryViewerSlice';
import { selectPlaying, setPreview } from 'renderer/redux/slices/viewerSlice';
import animate from 'renderer/utils/animate';

type ExtendedGrid = Grid & { _scrollingContainer: HTMLDivElement };

const useStyles = createUseStyles({
  grid: {},
});

type Props = {
  width: number;
  height: number;
  fileEntry: FileEntryModel | null;
  selectedFile: FileEntryModel | null;
  setSelectedFile: (selectedFile: FileEntryModel | null) => void;
  peek: boolean;
  setPeek: (value: boolean) => void;
};

export default function PeekGridScroller({
  width,
  height,
  fileEntry,
  selectedFile,
  setSelectedFile,
  peek,
  setPeek,
}: Props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const [selectedFolder, setSelectedFolder] = useState(fileEntry);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const playing = useSelector(selectPlaying);
  const sort = useSelector(selectGallerySort);

  const gridRef = useRef<ExtendedGrid | null>(null);
  const scroll = useRef<number>(0);
  const cancelAnimation = useRef<Function | null>(null);

  const columnCount = Math.floor(width / THUMBNAIL_HEIGHT);
  const rowCount = Math.ceil(size(selectedFolder?.children) / columnCount);

  const updated = useAutomaticChildrenLoader(selectedFolder);
  const sortedFiles = useMemo(() => {
    const [sortProperty, direction] = sort.split(':');
    const entries = values(selectedFolder?.children);

    if (sortProperty === 'fullPath') {
      const sorter = natsort({
        insensitive: true,
        desc: direction === 'desc',
      });
      return entries.sort((a, b) => sorter(a[sortProperty], b[sortProperty]));
    }

    return orderBy(entries, ...sort.split(':'));
  }, [selectedFolder, sort, updated]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [selectedFolder]);

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);

    return () => {
      jss.removeStyleSheet(x);
    };
  }, []);

  useEffect(() => {
    const rule = sheet?.addRule(`peek-grid-thumbnail-${selectedIndex}`, {
      background: 'rgba(255,255,255,.2)',
    });

    return () => {
      if (rule) {
        sheet?.deleteRule(rule.key);
      }
    };
  }, [selectedIndex, sheet]);

  const isTargetWithinGridButNotThumbnail = (target: EventTarget | null) => {
    const grid = document.getElementsByClassName(classes.grid)[0];
    const thumbnails = document.getElementsByClassName('peek-grid-thumbnail');

    return (
      target && grid?.contains(target as Node) && !some(thumbnails, (thumbnail) => thumbnail.contains(target as Node))
    );
  };

  useEventListener('click', (event: MouseEvent) => {
    if (selectedIndex !== null && isTargetWithinGridButNotThumbnail(event.target)) {
      selectIndex(null);
    }
  });

  const space = (event: React.KeyboardEvent) => {
    if (selectedIndex === null || (peek && selectedFile?.isVideo() && !event.shiftKey)) {
      return;
    }

    event.preventDefault();
    setPeek(!peek);
  };

  const enter = (event: React.KeyboardEvent) => {
    event.preventDefault();
    openIndex(selectedIndex);
  };

  const escape = (event: React.KeyboardEvent) => {
    event.preventDefault();
    setPeek(false);
  };

  const arrowLeft = (event: React.KeyboardEvent) => {
    if (event.shiftKey || playing) {
      return;
    }

    event.preventDefault();
    if (selectedIndex === null) {
      trySelectIndex(sortedFiles.length - 1);
    } else {
      trySelectIndex(selectedIndex - 1);
    }
  };

  const arrowRight = (event: React.KeyboardEvent) => {
    if (event.shiftKey || playing) {
      return;
    }

    event.preventDefault();
    if (selectedIndex === null) {
      trySelectIndex(0);
    } else {
      trySelectIndex(selectedIndex + 1);
    }
  };

  const arrowUp = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (selectedIndex === null) {
      trySelectIndex(sortedFiles.length - 1);
    } else {
      trySelectIndex(selectedIndex - columnCount);
    }
  };

  const arrowDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (selectedIndex === null) {
      trySelectIndex(0);
    } else {
      trySelectIndex(selectedIndex + columnCount);
    }
  };

  const trySelectIndex = (nextIndex: number) => {
    if (nextIndex >= 0 && nextIndex < sortedFiles.length) {
      selectIndex(nextIndex);
    }
  };

  useEventListener(
    'mousedown',
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.button === 3 && selectedFolder?.parent && selectedFolder !== fileEntry) {
        setSelectedFolder(selectedFolder.parent);
        setSelectedIndex(0);
      }

      if (event.button === 1 && isTargetWithinGridButNotThumbnail(event.target)) {
        dispatch(setPreview(false));
      }
    },
    undefined,
    undefined,
    { capture: true },
  );

  useEventListener('keydown', (event: React.KeyboardEvent) => {
    switch (event.key) {
      case ' ':
        return space(event);
      case 'Escape':
        return escape(event);
      case 'Enter':
        return enter(event);
      case 'ArrowLeft':
        return arrowLeft(event);
      case 'ArrowRight':
        return arrowRight(event);
      case 'ArrowUp':
        return arrowUp(event);
      case 'ArrowDown':
        return arrowDown(event);
      default:
        return false;
    }
  });

  const setSelectedFileDebounced = useDebouncedCallback(
    (file) => {
      if (file && file.isFolder) {
        setSelectedFile(file.cover);
      } else {
        setSelectedFile(file);
      }
    },
    100,
    { leading: true },
  );

  const selectIndex = (index: number | null) => {
    setSelectedIndex(index);
    if (index !== null) {
      const file = sortedFiles[index];
      setSelectedFileDebounced(file);
      maybeScrollAnimate(index);
    }
  };

  const openIndex = (index: number | null) => {
    setSelectedIndex(index);
    if (index !== null) {
      const file = sortedFiles[index];
      if (file && file.isFolder) {
        setSelectedFolder(file);
        setSelectedIndex(0);
      } else {
        setSelectedFile(file);
        setPeek(true);
      }
    }
  };

  const maybeScrollAnimate = (nextSelectedIndex: number) => {
    if (!sortedFiles) {
      return;
    }

    const selectedRowIndex = Math.floor(nextSelectedIndex / columnCount);
    const position = selectedRowIndex * THUMBNAIL_SIZE;
    const topEdge = Math.max(0, position - THUMBNAIL_SIZE);
    const bottomEdge = Math.min(rowCount * THUMBNAIL_SIZE, position + 2 * THUMBNAIL_SIZE);

    const topDiff = Math.abs(topEdge - scroll.current);
    const bottomDiff = Math.abs(bottomEdge - (scroll.current + height));

    if (scroll.current < topEdge && bottomEdge < scroll.current + height) {
      return;
    }

    startAnimation(topDiff < bottomDiff ? topEdge : bottomEdge - height);
  };

  const startAnimation = (toValue: number) => {
    if (cancelAnimation.current) {
      cancelAnimation.current();
    }

    cancelAnimation.current = animate({
      easing: 'linear',
      fromValue: scroll.current,
      toValue,
      onUpdate: (value, callback) => {
        if (gridRef.current) {
          // eslint-disable-next-line no-underscore-dangle
          gridRef.current._scrollingContainer.scrollTop = value;
          scroll.current = value;
        }
        callback();
      },
      onComplete: () => {
        gridRef.current?.scrollToPosition({ scrollLeft: 0, scrollTop: toValue });
      },
      duration: 150,
    });
  };

  const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
    scroll.current = scrollTop;
  };

  const cellRenderer = ({ columnIndex, rowIndex, style }: GridCellProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const file = sortedFiles[index];
    if (!file) {
      return null;
    }

    return (
      <GridThumbnail
        key={file.fullPath}
        index={index}
        fileEntry={file}
        onClick={() => selectIndex(index)}
        onDoubleClick={() => openIndex(index)}
        onAuxClick={(event: React.MouseEvent) => {
          if (event.button === 1) {
            selectIndex(index);
            setPeek(!peek);
          }
        }}
        style={style}
        classPrefix="peek-"
      />
    );
  };

  return (
    <Grid
      ref={gridRef}
      className={classes.grid}
      cellRenderer={cellRenderer}
      columnWidth={THUMBNAIL_HEIGHT}
      columnCount={columnCount}
      rowHeight={THUMBNAIL_SIZE}
      rowCount={rowCount}
      height={height}
      width={width}
      overscanRowCount={5}
      onScroll={handleScroll}
    />
  );
}
