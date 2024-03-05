import type { StyleSheet } from 'jss';
import { orderBy, some, values } from 'lodash';
import natsort from 'natsort';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Grid, GridCellProps } from 'react-virtualized';
import { useDebouncedCallback } from 'use-debounce';

import { THUMBNAIL_HEIGHT, THUMBNAIL_SIZE } from 'renderer/components/gallery-viewer/grid-viewer/GridFolderThumbnail';
import GridThumbnail from 'renderer/components/gallery-viewer/grid-viewer/GridThumbnail';
import ScrollRestoration from 'renderer/components/gallery-viewer/grid-viewer/ScrollRestoration';
import useAutomaticChildrenLoader from 'renderer/hooks/useAutomaticChildrenLoader';
import useEventListener from 'renderer/hooks/useEventListener';
import useSelectedFolder from 'renderer/hooks/useSelectedFolder';
import useSelectedIndex from 'renderer/hooks/useSelectedIndex';
import { openFolder } from 'renderer/redux/slices/folderVisibilitySlice';
import {
  selectGallerySortBy,
  selectGallerySortDirection,
  setFilesCount,
} from 'renderer/redux/slices/galleryViewerSlice';
import { selectSelectedFile, setSelectedFile } from 'renderer/redux/slices/selectedFolderSlice';
import {
  selectPlaying,
  selectPreview,
  selectPreviewType,
  setPreview,
  setPreviewType,
} from 'renderer/redux/slices/viewerSlice';
import animate from 'renderer/utils/animate';

export type ExtendedGrid = Grid & { _scrollingContainer: HTMLDivElement };

const useStyles = createUseStyles({
  grid: {},
});

type Props = {
  width: number;
  height: number;
  search: string;
};

export default function GridScroller({ width, height, search }: Props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const [selectedFolder, setSelectedFolder] = useSelectedFolder();
  const [selectedIndex, setSelectedIndex] = useSelectedIndex();
  const selectedFile = useSelector(selectSelectedFile);
  const sortBy = useSelector(selectGallerySortBy);
  const sortDirection = useSelector(selectGallerySortDirection);
  const preview = useSelector(selectPreview);
  const previewType = useSelector(selectPreviewType);
  const playing = useSelector(selectPlaying);
  const location = useLocation();
  const [isScrolling, setIsScrolling] = useState<boolean | undefined>(undefined);

  const gridRef = useRef<ExtendedGrid | null>(null);
  const scroll = useRef<number>(0);
  const cancelAnimation = useRef<Function | null>(null);

  const updated = useAutomaticChildrenLoader(selectedFolder);

  const filteredFiles = useMemo(() => {
    const entries = values(selectedFolder?.children);

    return search
      ? entries.filter((file) => file.fullPath.toLowerCase().indexOf(search.toLocaleLowerCase()) !== -1)
      : entries;
  }, [selectedFolder, updated, search]);

  const columnCount = Math.floor(width / THUMBNAIL_HEIGHT);
  const rowCount = Math.ceil(filteredFiles.length / columnCount);
  const rowCountInWindow = Math.floor(height / THUMBNAIL_SIZE);

  const sortedFiles = useMemo(() => {
    if (sortBy === 'fullPath') {
      const sorter = natsort({
        insensitive: true,
        desc: sortDirection === 'desc',
      });
      return filteredFiles.sort((a, b) => sorter(a[sortBy], b[sortBy]));
    }

    return orderBy(filteredFiles, sortBy, sortDirection);
  }, [filteredFiles, sortBy, sortDirection]);

  useEffect(() => {
    const [index] = location.hash.replace('#', '').split('_').map(Number);

    setSelectedIndex(index || null);
  }, [selectedFolder]);

  useEffect(() => {
    dispatch(setFilesCount(filteredFiles.length));
  }, [filteredFiles.length]);

  useEffect(() => {
    if (gridRef.current) {
      gridRef.current?.scrollToPosition({ scrollLeft: 0, scrollTop: 0 });
    }
    selectIndex(0);
  }, [search]);

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);

    return () => {
      jss.removeStyleSheet(x);
    };
  }, []);

  useEffect(() => {
    const rule = sheet?.addRule(`grid-thumbnail-${selectedIndex}`, {
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
    const thumbnails = document.getElementsByClassName('grid-thumbnail');

    return (
      target && grid.contains(target as Node) && !some(thumbnails, (thumbnail) => thumbnail.contains(target as Node))
    );
  };

  useEventListener('click', (event: MouseEvent) => {
    if (selectedIndex !== null && isTargetWithinGridButNotThumbnail(event.target)) {
      selectIndex(null);
    }
  });

  const space = (event: React.KeyboardEvent) => {
    if (selectedIndex === null || preview) {
      return;
    }

    event.preventDefault();
    dispatch(setPreviewType(event.shiftKey ? 'file' : 'cover'));
    dispatch(setPreview(!preview));
  };

  const enter = (event: React.KeyboardEvent) => {
    if (preview) {
      return;
    }

    event.preventDefault();
    openIndex(selectedIndex);
  };

  const escape = (event: React.KeyboardEvent) => {
    event.preventDefault();
    dispatch(setPreview(false));
  };

  const arrowLeft = (event: React.KeyboardEvent) => {
    if (preview && selectedFile?.isFolder && previewType === 'file') {
      return;
    }

    if (playing && !event.shiftKey) {
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
    if (preview && selectedFile?.isFolder && previewType === 'file') {
      return;
    }

    if (playing && !event.shiftKey) {
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
    if (preview && selectedFile?.isFolder && previewType === 'file') {
      return;
    }

    event.preventDefault();
    if (selectedIndex === null) {
      trySelectIndex(sortedFiles.length - 1);
    } else {
      trySelectIndex(selectedIndex - columnCount);
    }
  };

  const arrowDown = (event: React.KeyboardEvent) => {
    if (preview && selectedFile?.isFolder && previewType === 'file') {
      return;
    }

    event.preventDefault();
    if (selectedIndex === null) {
      trySelectIndex(0);
    } else {
      trySelectIndex(selectedIndex + columnCount);
    }
  };

  const pageUp = (event: React.KeyboardEvent) => {
    if (preview && selectedFile?.isFolder && previewType === 'file') {
      return;
    }

    event.preventDefault();
    if (selectedIndex !== null) {
      trySelectIndex(Math.max((selectedIndex ?? 0) - columnCount * rowCountInWindow, 0));
    } else {
      startAnimation(Math.max(scroll.current - height, 0));
    }
  };

  const pageDown = (event: React.KeyboardEvent) => {
    if (preview && selectedFile?.isFolder && previewType === 'file') {
      return;
    }

    event.preventDefault();
    if (selectedIndex !== null) {
      trySelectIndex(Math.min(selectedIndex + columnCount * rowCountInWindow, THUMBNAIL_SIZE * rowCount));
    } else {
      startAnimation(Math.min(scroll.current + height, THUMBNAIL_SIZE * rowCount));
    }
  };

  const trySelectIndex = (nextIndex: number) => {
    if (nextIndex >= 0 && nextIndex < sortedFiles.length) {
      selectIndex(nextIndex);
    }
  };

  useEventListener('mousedown', (event: React.MouseEvent) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });

  useEventListener('keydown', (event: React.KeyboardEvent) => {
    switch (event.key) {
      case ' ':
        return space(event);
      case 'Escape':
        return escape(event);
      case 'Enter':
        return enter(event);
      case 'ArrowLeft':
        return !event.ctrlKey && arrowLeft(event);
      case 'ArrowRight':
        return !event.ctrlKey && arrowRight(event);
      case 'ArrowUp':
        return !event.ctrlKey && arrowUp(event);
      case 'ArrowDown':
        return !event.ctrlKey && arrowDown(event);
      case 'PageDown':
        return pageDown(event);
      case 'PageUp':
        return pageUp(event);
      default:
        return false;
    }
  });

  const setSelectedFileDebounced = useDebouncedCallback(
    (file) => {
      if (file && file.isFolder) {
        dispatch(setSelectedFile(file));
      } else {
        dispatch(setSelectedFile(file));
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
        if (cancelAnimation.current) cancelAnimation.current();
        setSelectedFolder(file);
        dispatch(openFolder(file.parent));
      } else {
        dispatch(setSelectedFile(file));
        dispatch(setPreview(true));
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

    setIsScrolling(true);
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
        setIsScrolling(false);
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
            dispatch(setPreview(!preview));
          }
        }}
        style={style}
      />
    );
  };

  console.log({ rowCount, columnCount, rowCountInWindow });

  return (
    <>
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
        overscanRowCount={rowCountInWindow + 1}
        onScroll={handleScroll}
        isScrolling={isScrolling}
      />
      <ScrollRestoration grid={gridRef.current || undefined} />
    </>
  );
}
