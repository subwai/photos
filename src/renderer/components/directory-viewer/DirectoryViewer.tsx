import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';
import { each, min, max } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet } from 'jss';
import useEventListener from '../../hooks/useEventListener';
import useDragging from '../../hooks/useDragging';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import FileEntry from '../../models/FileEntry';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';
import { setSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import FolderList from './FolderList';
import { selectFolderSize, setFolderSize } from '../../redux/slices/folderSizeSlice';

const useStyles = createUseStyles({
  container: {
    overflow: 'auto',
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
  },
  list: {
    width: '100%!important',
  },
  containerFolderResize: {
    padding: 10,
  },
  lineFolderResize: {
    width: '100%',
    background: '#888',
    height: 1,
    position: 'relative',
  },
  dragHandleFolderResize: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 10,
    background: '#888',
    cursor: 'pointer',
    left: 0,
    top: -5,
  },
});

const MIN_FOLDER_HEIGHT = 20;
const MAX_FOLDER_HEIGHT = 150;

export default function DirectoryViewer(): JSX.Element {
  const classes = useStyles();
  const rootFolder = useSelector(selectRootFolder);
  const openFolders = useSelector(selectOpenFolders);
  const folderSize = useSelector(selectFolderSize);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [width, setWidth] = useState<number>(250);
  const [folderResizeHandlePosition, setFolderResizeHandlePosition] = useState<number>(
    (folderSize - MIN_FOLDER_HEIGHT) / (MAX_FOLDER_HEIGHT - MIN_FOLDER_HEIGHT) / width
  );
  const container = useRef<HTMLDivElement>(null);
  const dragHandleContainerResize = useRef<HTMLDivElement>(null);
  const dragHandleFolderResize = useRef<HTMLSpanElement>(null);
  const [sheet, setSheet] = useState<StyleSheet<string> | null>();
  const dispatch = useDispatch();

  const visibleFolders = useMemo(() => {
    function appendChildren(carry: FileEntry[], entry: FileEntry) {
      const isOpen = openFolders[entry.fullPath] || entry === rootFolder;
      if (entry.isFolder) {
        carry.push(entry);
      }
      if (isOpen) {
        each(entry.children, (child) => appendChildren(carry, child));
      }
    }

    const carry: FileEntry[] = [];
    if (rootFolder) {
      appendChildren(carry, rootFolder);
    }

    return carry;
  }, [rootFolder, openFolders]);

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
  }, [selectedIndex, sheet]);

  useDragging(
    dragHandleContainerResize,
    ({ x }) => {
      if (container.current === null || dragHandleContainerResize.current === null) {
        return;
      }

      const newWidth = max([0, width + x]) || 0;
      container.current.style.width = `${newWidth}px`;
      dragHandleContainerResize.current.style.left = `${newWidth - 1}px`;
    },
    ({ x }) => {
      setWidth(max([0, width + x]) || 0);
    }
  );

  useDragging(
    dragHandleFolderResize,
    ({ x }) => {
      if (dragHandleFolderResize.current === null) {
        return;
      }

      const newPosition =
        min([dragHandleFolderResize.current?.parentElement?.clientWidth, max([0, folderResizeHandlePosition + x])]) ||
        0;
      dragHandleFolderResize.current.style.left = `${newPosition}px`;
    },
    ({ x }) => {
      const newPosition =
        min([dragHandleFolderResize.current?.parentElement?.clientWidth, max([0, folderResizeHandlePosition + x])]) ||
        0;
      setFolderResizeHandlePosition(newPosition);
      dispatch(setFolderSize((newPosition / width) * (MAX_FOLDER_HEIGHT - MIN_FOLDER_HEIGHT) + MIN_FOLDER_HEIGHT));
    }
  );

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
        <FolderList visibleFolders={visibleFolders} rootFolder={rootFolder} onSelectIndex={setSelectedIndex} />
      </div>
      <div className={classes.containerFolderResize}>
        <div className={classes.lineFolderResize}>
          <span
            ref={dragHandleFolderResize}
            className={classes.dragHandleFolderResize}
            style={{ left: folderResizeHandlePosition }}
          />
        </div>
      </div>
    </div>
  );
}
