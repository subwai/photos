import { StyleSheet } from 'jss';
import { each, find, max, min, throttle } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import uuid from 'uuid';
import useDragging from '../../hooks/useDragging';
import useEventListener from '../../hooks/useEventListener';
import useFileEventListener from '../../hooks/useFileEventListener';
import { FileEntryModel } from '../../models/FileEntry';
import { DEFAULT_FOLDER_SIZE, selectFolderSize, setFolderSize } from '../../redux/slices/folderSizeSlice';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import { setSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import FolderList from './FolderList';

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
    overflow: 'auto',
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

const MIN_FOLDER_HEIGHT = 20;
const MAX_FOLDER_HEIGHT = 150;

function getFolderSizeFromPosition(position: number, width: number): number {
  return (position / (width - FOLDER_RESIZE_PADDING * 2)) * (MAX_FOLDER_HEIGHT - MIN_FOLDER_HEIGHT) + MIN_FOLDER_HEIGHT;
}

function getPositionFromFolderSize(folderSize: number, width: number): number {
  return (
    ((folderSize - MIN_FOLDER_HEIGHT) / (MAX_FOLDER_HEIGHT - MIN_FOLDER_HEIGHT)) * (width - FOLDER_RESIZE_PADDING * 2)
  );
}

export default function DirectoryViewer(): JSX.Element {
  const classes = useStyles();
  const rootFolder = useSelector(selectRootFolder);
  const openFolders = useSelector(selectOpenFolders);
  const folderSize = useSelector(selectFolderSize);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [width, setWidth] = useState<number>(250);
  const [folderResizeHandlePosition, setFolderResizeHandlePosition] = useState<number>(
    getPositionFromFolderSize(folderSize, width)
  );

  const container = useRef<HTMLDivElement>(null);
  const dragHandleContainerResize = useRef<HTMLDivElement>(null);
  const sliderFolderResize = useRef<HTMLDivElement>(null);
  const dragHandleFolderResize = useRef<HTMLDivElement>(null);
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const [update, triggerUpdate] = useState<string>(uuid.v4());
  const dispatch = useDispatch();

  const visibleFolders = useMemo(() => {
    function appendChildren(carry: FileEntryModel[], entry: FileEntryModel) {
      const isOpen = openFolders[entry.fullPath] || entry === rootFolder;
      if (entry.isFolder) {
        carry.push(entry);
      }
      if (isOpen) {
        each(entry.children, (child) => appendChildren(carry, child));
      }
    }

    const carry: FileEntryModel[] = [];
    if (rootFolder) {
      appendChildren(carry, rootFolder);
    }

    return carry;
  }, [rootFolder, openFolders, update]);

  const triggerUpdateThrottled = useMemo(() => throttle(() => triggerUpdate(uuid.v4()), 2000), [triggerUpdate]);

  useFileEventListener(
    'all',
    ({ target }: { target: FileEntryModel }) => {
      if (find(openFolders, (_, path: string) => path.indexOf(target.fullPath) !== -1)) {
        triggerUpdateThrottled();
      }
    },
    rootFolder
  );
  useFileEventListener(
    'remove',
    ({ target }: { target: FileEntryModel }) => {
      if (find(openFolders, (_, path: string) => path.indexOf(target.fullPath) !== -1)) {
        triggerUpdateThrottled();
      }
    },
    rootFolder
  );

  useEffect(() => {
    if (!visibleFolders[selectedIndex]) {
      setSelectedIndex(0);
    }
  }, [visibleFolders]);

  useEffect(() => {
    const x = jss.createStyleSheet({}, { link: true, generateId: (rule) => rule.key }).attach();
    setSheet(x);

    return () => {
      jss.removeStyleSheet(x);
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (visibleFolders[selectedIndex]) {
        dispatch(setSelectedFolder(visibleFolders[selectedIndex]));
      }
    }, 100);
    const rule = sheet?.addRule(`folder-${selectedIndex}`, {
      background: 'rgba(255,255,255,.2)',
    });

    return () => {
      if (rule) {
        sheet?.deleteRule(rule.key);
      }
      clearTimeout(timeout);
    };
  }, [selectedIndex, sheet, dispatch]);

  useDragging(
    dragHandleContainerResize,
    ({ x }) => {
      if (container.current === null || dragHandleContainerResize.current === null) {
        return;
      }

      const newWidth = max([0, width + x]) || 0;
      container.current.style.width = `${newWidth}px`;
      dragHandleContainerResize.current.style.left = `${newWidth - 1}px`;

      if (dragHandleFolderResize.current) {
        dragHandleFolderResize.current.style.left = `${getPositionFromFolderSize(folderSize, newWidth)}px`;
      }
    },
    () => {},
    ({ x }) => {
      const newWidth = max([0, width + x]) || 0;
      setWidth(newWidth);
      setFolderResizeHandlePosition(getPositionFromFolderSize(folderSize, newWidth));
    }
  );

  useDragging(
    sliderFolderResize,
    ({ x }) => {
      if (dragHandleFolderResize.current === null) {
        return;
      }

      const newPosition = min([width - FOLDER_RESIZE_PADDING * 2, max([0, folderResizeHandlePosition + x])]) || 0;
      dragHandleFolderResize.current.style.left = `${newPosition}px`;
    },
    ({ x }) => {
      if (dragHandleFolderResize.current === null) {
        return;
      }

      setFolderResizeHandlePosition(x);
      dragHandleFolderResize.current.style.left = `${x}px`;
    },
    ({ x }) => {
      const newPosition = min([width - FOLDER_RESIZE_PADDING * 2, max([0, folderResizeHandlePosition + x])]) || 0;
      setFolderResizeHandlePosition(newPosition);
      dispatch(setFolderSize(getFolderSizeFromPosition(newPosition, width)));
    }
  );

  const resetFolderSize = () => {
    dispatch(setFolderSize(DEFAULT_FOLDER_SIZE));
    setFolderResizeHandlePosition(getPositionFromFolderSize(DEFAULT_FOLDER_SIZE, width));
  };

  const findParentIndex = (index: number) => {
    const selectedFolder = visibleFolders[index];
    for (let i = index - 1; i >= 0; i -= 1) {
      if (visibleFolders[i].level < selectedFolder.level) {
        return i;
      }
    }

    return 0;
  };

  const arrowLeft = (event: React.KeyboardEvent) => {
    event.preventDefault();
    const selectedFolder = visibleFolders[selectedIndex];
    const isOpen = openFolders[selectedFolder.fullPath] || selectedFolder === rootFolder;
    if (isOpen) {
      dispatch(closeFolder(selectedFolder));
    } else {
      const parentIndex = findParentIndex(selectedIndex);
      setSelectedIndex(parentIndex);
      dispatch(closeFolder(visibleFolders[parentIndex]));
    }
  };
  const arrowRight = (event: React.KeyboardEvent) => {
    event.preventDefault();
    const selectedFolder = visibleFolders[selectedIndex];
    const isOpen = openFolders[selectedFolder.fullPath] || selectedFolder === rootFolder;
    if (!isOpen) {
      dispatch(openFolder(selectedFolder));
    }
  };
  const arrowUp = (event: React.KeyboardEvent) => {
    event.preventDefault();
    setSelectedIndex(Math.max(selectedIndex - 1, 0));
  };
  const arrowDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    setSelectedIndex(Math.min(selectedIndex + 1, visibleFolders.length - 1));
  };

  useEventListener('keydown', (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        return event.shiftKey && arrowLeft(event);
      case 'ArrowRight':
        return event.shiftKey && arrowRight(event);
      case 'ArrowUp':
        return !document.fullscreenElement && arrowUp(event);
      case 'ArrowDown':
        return !document.fullscreenElement && arrowDown(event);
      default:
        return false;
    }
  });

  return (
    <div ref={container} className={classes.container} style={{ width }}>
      <div
        ref={dragHandleContainerResize}
        className={classes.dragHandleContainerResize}
        role="separator"
        style={{ left: width - 1 }}
      />
      <div className={classes.folderNames}>
        <FolderList visibleFolders={visibleFolders} onSelectIndex={setSelectedIndex} />
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
}
