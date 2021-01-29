import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles, jss } from 'react-jss';

import { each, map, max } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet } from 'jss';
import Folder from './Folder';
import useEventListener from '../../hooks/useEventListener';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import FileEntry from '../../models/FileEntry';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';
import { setSelectedFolder } from '../../redux/slices/selectedFolderSlice';

interface FolderListProps {
  visibleFolders: FileEntry[];
  rootFolder: FileEntry | null;
  onSelectIndex: (index: number) => void;
}

const FolderList = memo(function FolderList({
  visibleFolders,
  rootFolder,
  onSelectIndex,
}: FolderListProps): JSX.Element {
  return (
    <>
      {map(visibleFolders, (folder, index: number) => (
        <Folder
          key={folder.fullPath}
          index={index}
          fileEntry={folder}
          isRoot={folder === rootFolder}
          onClick={() => {
            onSelectIndex(index);
          }}
        />
      ))}
    </>
  );
});

const useStyles = createUseStyles({
  container: {
    overflow: 'auto',
    userSelect: 'none',
    display: 'flex',
  },
  background: {
    position: 'absolute',
    background: 'rgba(0,0,0,.2)',
    height: '100%',
    zIndex: -1,
  },
  dragHandle: {
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
  folderVisibility: {},
});

export default function DirectoryViewer(): JSX.Element {
  const classes = useStyles();
  const rootFolder = useSelector(selectRootFolder);
  const openFolders = useSelector(selectOpenFolders);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [width, setWidth] = useState<number>(250);
  const [dragStart, setDragging] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<HTMLDivElement>(null);
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

  const startDragging = (event: React.MouseEvent) => {
    event.preventDefault();
    setDragging(event.pageX);
  };

  useEventListener(
    'pointermove',
    (event: MouseEvent) => {
      event.preventDefault();
      if (container.current === null || dragHandle.current === null || dragStart === null) {
        return;
      }

      const newWidth = max([0, width + event.pageX - dragStart]) || 0;
      container.current.style.width = `${newWidth}px`;
      dragHandle.current.style.left = `${newWidth - 1}px`;
    },
    window,
    dragStart !== null
  );

  useEventListener(
    'pointerup',
    (event: MouseEvent) => {
      event.preventDefault();
      if (dragStart === null) {
        return;
      }

      const newWidth = max([0, width + event.pageX - dragStart]) || 0;
      setDragging(null);
      setWidth(newWidth);
    },
    window,
    dragStart !== null
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
        ref={dragHandle}
        className={classes.dragHandle}
        role="separator"
        onMouseDown={startDragging}
        style={{ left: width - 1 }}
      />
      <div className={classes.folderNames}>
        <FolderList visibleFolders={visibleFolders} rootFolder={rootFolder} onSelectIndex={setSelectedIndex} />
      </div>
      <div className={classes.background} style={{ width }} />
    </div>
  );
}
