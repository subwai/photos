import type { Rule, StyleSheet } from 'jss';
import { each, find, reduce, values } from 'lodash';
import natsort from 'natsort';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { AutoSizer } from 'react-virtualized';
import { useDebouncedCallback, useThrottledCallback } from 'use-debounce';
import { v4 as uuid4 } from 'uuid';

import { FOLDER_ICON_SIDE_MARGIN } from 'renderer/components/directory-viewer/FolderIcon';
import FolderList from 'renderer/components/directory-viewer/FolderList';
import { ExtendedGrid } from 'renderer/components/gallery-viewer/grid-viewer/GridScroller';
import useDragging from 'renderer/hooks/useDragging';
import useEventListener from 'renderer/hooks/useEventListener';
import useFileRerenderListener from 'renderer/hooks/useFileRerenderListener';
import useSelectedFolder from 'renderer/hooks/useSelectedFolder';
import type { FileEntryModel } from 'renderer/models/FileEntry';
import { closeFolder, openFolder, selectOpenFolders } from 'renderer/redux/slices/folderVisibilitySlice';
import { selectGalleryViewer } from 'renderer/redux/slices/galleryViewerSlice';
import { selectRootFolder } from 'renderer/redux/slices/rootFolderSlice';

const FOLDER_RESIZE_PADDING = 10;

const useStyles = createUseStyles({
  container: {
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0,0,0,.2)',
  },
  dragHandleContainerResize: {
    position: 'absolute',
    height: '100%',
    width: 1,
    background: '#555',
    zIndex: 1,
    '&:after': {
      content: '""',
      width: 9,
      position: 'absolute',
      top: 0,
      bottom: 0,
      marginLeft: -4,
      backgroundColor: 'transparent',
      cursor: 'ew-resize',
      zIndex: 2,
    },
  },
  folderNames: {
    flex: 1,
    display: 'flex',
  },
  list: {
    width: '100%!important',
  },
  containerFolderResize: {
    padding: `0 ${FOLDER_RESIZE_PADDING}px`,
  },
  lineFolderResize: {
    width: '100%',
    position: 'relative',
    cursor: 'pointer',
    padding: '10px 0',
    '&:before': {
      display: 'block',
      content: '""',
      height: 1,
      background: '#888',
    },
  },
  dragHandleFolderResize: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 10,
    background: '#888',
    marginLeft: -5,
    top: 5,
  },
});

const MIN_FOLDER_SIZE = 20;
const MAX_FOLDER_SIZE = 150;
const DEFAULT_FOLDER_SIZE = 40;

function getFolderSizeFromPosition(position: number, width: number): number {
  return (position / (width - FOLDER_RESIZE_PADDING * 2)) * (MAX_FOLDER_SIZE - MIN_FOLDER_SIZE) + MIN_FOLDER_SIZE;
}

function getPositionFromFolderSize(folderSize: number, width: number): number {
  return ((folderSize - MIN_FOLDER_SIZE) / (MAX_FOLDER_SIZE - MIN_FOLDER_SIZE)) * (width - FOLDER_RESIZE_PADDING * 2);
}

export default memo(function DirectoryViewer(): JSX.Element {
  const classes = useStyles();
  const dispatch = useDispatch();
  const rootFolder = useSelector(selectRootFolder);
  const openFolders = useSelector(selectOpenFolders);
  const viewer = useSelector(selectGalleryViewer);
  const [selectedFolder, setSelectedFolder] = useSelectedFolder();
  const [locallySelectedFolder, setLocallySelectedFolder] = useState<FileEntryModel | null>(rootFolder);
  const [wantedWidth, setWantWidth] = useState<number>(250);
  const [folderSize, setFolderSize] = useState<number>(DEFAULT_FOLDER_SIZE);
  const maxWidth = window.innerWidth - 388;
  const width = Math.min(wantedWidth, maxWidth);
  const [folderResizeHandlePosition, setFolderResizeHandlePosition] = useState<number>(
    getPositionFromFolderSize(folderSize, width),
  );

  const container = useRef<HTMLDivElement>(null);
  const dragHandleContainerResize = useRef<HTMLDivElement>(null);
  const sliderFolderResize = useRef<HTMLDivElement>(null);
  const dragHandleFolderResize = useRef<HTMLDivElement>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const [update, triggerUpdate] = useState<string>(uuid4());
  const folderSizeRules = useRef<(Rule | null)[]>();
  const gridRef = useRef<ExtendedGrid | null>(null);

  const visibleFolders = useMemo(() => {
    function appendChildren(carry: FileEntryModel[], entry: FileEntryModel) {
      const isOpen = openFolders[entry.fullPath] || entry === rootFolder;
      if (entry.isFolder) {
        carry.push(entry);
      }
      if (isOpen) {
        const sorter = natsort({
          insensitive: true,
          desc: false,
        });
        const sortedChildren = values(entry.children || []).sort((a, b) => sorter(a.fullPath, b.fullPath)) || [];

        each(sortedChildren, (child) => appendChildren(carry, child));
      }
    }

    const carry: FileEntryModel[] = [];
    if (rootFolder) {
      appendChildren(carry, rootFolder);
    }

    return carry;
  }, [rootFolder, openFolders, update]);

  const visibleFoldersIndex = useMemo(
    () =>
      reduce<FileEntryModel, { [key: string]: number }>(
        visibleFolders,
        (index, folder, key) => {
          index[folder.fullPath] = Number(key);

          return index;
        },
        {},
      ),
    [visibleFolders],
  );

  const triggerUpdateThrottled = useThrottledCallback(() => triggerUpdate(uuid4()), 2000);
  const setSelectedFolderDebounced = useDebouncedCallback((f) => setSelectedFolder(f), 250);

  useFileRerenderListener(({ target }: { target: FileEntryModel }) => {
    if (
      find(
        { [rootFolder?.fullPath || '']: true, ...openFolders },
        (_, path: string) => path.indexOf(target.fullPath) !== -1,
      )
    ) {
      triggerUpdateThrottled();
    }
  }, rootFolder);

  useEffect(() => {
    if (!locallySelectedFolder) {
      setLocallySelectedFolder(visibleFolders[0]);
    }
  }, [visibleFolders]);

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);
    updateFolderSizeJssRule(folderSize, x);

    return () => {
      jss.removeStyleSheet(x);
      setSelectedFolderDebounced.flush();
    };
  }, []);

  useEffect(() => {
    setSelectedFolderDebounced(locallySelectedFolder);
    const rule = sheet?.addRule(`folder-${locallySelectedFolder?.objectPath}`, {
      background: 'rgba(255,255,255,.2)',
    });

    return () => {
      if (rule) {
        sheet?.deleteRule(rule.key);
      }
    };
  }, [locallySelectedFolder, sheet, dispatch]);

  useEffect(() => {
    setLocallySelectedFolder(selectedFolder);
    const nextIndex = selectedFolder ? visibleFoldersIndex[selectedFolder.fullPath] : null;
    if (nextIndex) {
      maybeScrollTo(nextIndex);
    }
  }, [selectedFolder]);

  useDragging(
    dragHandleContainerResize,
    ({ x }) => {
      if (container.current === null || dragHandleContainerResize.current === null) {
        return;
      }

      const newWidth = Math.min(Math.max(0, width + x) || 0, maxWidth);
      container.current.style.width = `${newWidth}px`;
      container.current.style.minWidth = `${newWidth}px`;
      dragHandleContainerResize.current.style.left = `${newWidth - 1}px`;

      if (gridRef.current) {
        // eslint-disable-next-line no-underscore-dangle
        const scrollingContainer = gridRef.current._scrollingContainer;
        scrollingContainer.style.width = `${newWidth}px`;
        scrollingContainer.style.maxWidth = `${newWidth}px`;
        if (scrollingContainer.firstElementChild) {
          const innerContainer = scrollingContainer.firstElementChild as HTMLElement;
          innerContainer.style.maxWidth = `${newWidth}px`;
        }
      }

      if (dragHandleFolderResize.current) {
        dragHandleFolderResize.current.style.left = `${getPositionFromFolderSize(folderSize, newWidth)}px`;
      }
    },
    () => {},
    ({ x }) => {
      const newWidth = Math.min(Math.max(0, width + x) || 0, maxWidth);
      setWantWidth(newWidth);
      setFolderResizeHandlePosition(getPositionFromFolderSize(folderSize, newWidth));
    },
  );

  useDragging(
    sliderFolderResize,
    ({ x }) => {
      if (dragHandleFolderResize.current === null) {
        return;
      }

      const newPosition = Math.min(width - FOLDER_RESIZE_PADDING * 2, Math.max(0, folderResizeHandlePosition + x)) || 0;
      const newSize = getFolderSizeFromPosition(newPosition, width);
      updateFolderSizeJssRuleThrottled(newSize);
      dragHandleFolderResize.current.style.left = `${newPosition}px`;
    },
    ({ x }) => {
      if (dragHandleFolderResize.current === null) {
        return;
      }

      const newSize = getFolderSizeFromPosition(x, width);
      setFolderResizeHandlePosition(x);
      setFolderSize(newSize);
      updateFolderSizeJssRule(newSize);
      dragHandleFolderResize.current.style.left = `${x}px`;
    },
    ({ x }) => {
      const newPosition = Math.min(width - FOLDER_RESIZE_PADDING * 2, Math.max(0, folderResizeHandlePosition + x)) || 0;
      const newSize = getFolderSizeFromPosition(newPosition, width);
      setFolderResizeHandlePosition(newPosition);
      setFolderSize(newSize);
      updateFolderSizeJssRule(newSize);
    },
  );

  const resetFolderSize = () => {
    updateFolderSizeJssRule(DEFAULT_FOLDER_SIZE);
    setFolderSize(DEFAULT_FOLDER_SIZE);
    setFolderResizeHandlePosition(getPositionFromFolderSize(DEFAULT_FOLDER_SIZE, width));
  };

  const updateFolderSizeJssRule = (newSize: number, jssSheet: StyleSheet<string> | null | undefined = sheet) => {
    if (!jssSheet) {
      return;
    }

    if (folderSizeRules.current) {
      each(folderSizeRules.current, (rule) => rule && jssSheet.deleteRule(rule.key));
    }
    folderSizeRules.current = [
      jssSheet.addRule('folder-size', { height: `${newSize}px` }),
      jssSheet.addRule('folder-icon', { fontSize: newSize - FOLDER_ICON_SIDE_MARGIN * 2 }),
    ];
  };
  const updateFolderSizeJssRuleThrottled = useThrottledCallback(updateFolderSizeJssRule, 100);

  const arrowLeft = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (!locallySelectedFolder) {
      return;
    }

    const isOpen = openFolders[locallySelectedFolder.fullPath] || locallySelectedFolder === rootFolder;
    if (isOpen) {
      dispatch(closeFolder(locallySelectedFolder));
    } else if (locallySelectedFolder.parent) {
      setLocallySelectedFolder(locallySelectedFolder.parent);
      dispatch(closeFolder(locallySelectedFolder.parent));
    }
  };
  const arrowRight = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (!locallySelectedFolder) {
      return;
    }

    const isOpen = openFolders[locallySelectedFolder.fullPath] || locallySelectedFolder === rootFolder;
    if (!isOpen) {
      dispatch(openFolder(locallySelectedFolder));
    }
  };
  const arrowUp = (event: React.KeyboardEvent) => {
    if (viewer === 'grid' && !event.ctrlKey) {
      return;
    }
    if (!locallySelectedFolder) {
      return;
    }

    event.preventDefault();
    const index = visibleFoldersIndex[locallySelectedFolder.fullPath];
    if (visibleFolders[index - 1]) {
      setLocallySelectedFolder(visibleFolders[index - 1]);
      maybeScrollTo(index - 1);
    }
  };
  const arrowDown = (event: React.KeyboardEvent) => {
    if (viewer === 'grid' && !event.ctrlKey) {
      return;
    }
    if (!locallySelectedFolder) {
      return;
    }

    event.preventDefault();
    const index = visibleFoldersIndex[locallySelectedFolder.fullPath];
    if (visibleFolders[index + 1]) {
      setLocallySelectedFolder(visibleFolders[index + 1]);
      maybeScrollTo(index + 1);
    }
  };

  const maybeScrollTo = (index: number) => {
    if (!scrollContainer.current) {
      return;
    }

    const maxTopPosition = Math.max(index - 1, 0) * folderSize;
    const currentTopPosition = scrollContainer.current.scrollTop;
    const minBottomPosition = Math.min(index + 2, visibleFolders.length) * folderSize;
    const currentBottomPosition = scrollContainer.current.scrollTop + scrollContainer.current.clientHeight;

    if (maxTopPosition < currentTopPosition) {
      scrollContainer.current.scrollTop = maxTopPosition;
    } else if (minBottomPosition > currentBottomPosition) {
      scrollContainer.current.scrollTop = minBottomPosition - scrollContainer.current.clientHeight;
    }
  };

  useEventListener('keydown', (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        return event.ctrlKey && arrowLeft(event);
      case 'ArrowRight':
        return event.ctrlKey && arrowRight(event);
      case 'ArrowUp':
        return !document.fullscreenElement && arrowUp(event);
      case 'ArrowDown':
        return !document.fullscreenElement && arrowDown(event);
      default:
        return false;
    }
  });

  return (
    <div ref={container} className={`${classes.container}`} style={{ width, minWidth: width }}>
      <div
        ref={dragHandleContainerResize}
        className={classes.dragHandleContainerResize}
        role="separator"
        style={{ left: width - 1 }}
      />
      <div ref={scrollContainer} className={`${classes.folderNames} overflow-hidden`}>
        <AutoSizer>
          {({ height }) => (
            <FolderList
              gridRef={gridRef}
              width={width}
              height={height}
              visibleFolders={visibleFolders}
              onSelectFolder={setLocallySelectedFolder}
            />
          )}
        </AutoSizer>
      </div>
      <div className={classes.containerFolderResize}>
        <div className={classes.lineFolderResize} ref={sliderFolderResize}>
          <span
            className={classes.dragHandleFolderResize}
            ref={dragHandleFolderResize}
            style={{ left: folderResizeHandlePosition }}
            onDoubleClick={resetFolderSize}
          />
        </div>
      </div>
    </div>
  );
});
