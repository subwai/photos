import React, { useEffect, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { filter } from 'lodash';
import classNames from 'classnames';

import { useDispatch, useSelector } from 'react-redux';
import FileEntry, { findFirstFolder, findLastFolder } from '../../utils/FileEntry';
import FolderName from './FolderName';
import useEventListener from '../../utils/useEventListener';
import { selectSelectedFolder, selectAutoSelectLastFolder, setSelectedFolder } from '../selectedFolderSlice';
import { closeFolder, openFolder, selectOpenFolders } from '../folderVisibilitySlice';

const useStyles = createUseStyles({
  root: {
    marginLeft: 0,
    width: 'calc(100% - 1px)',
  },
  entry: {
    display: 'flex',
    height: 40,
    margin: 1,
    padding: 4,
    boxSizing: 'border-box',
    fontSize: 14,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(255,255,255,.3)',
    },
  },
  selected: {
    background: 'rgba(255,255,255,.2)',
  },
});

interface Props {
  isRoot?: boolean;
  fileEntry: FileEntry;
  level?: number;
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
}

export default function Folder({
  isRoot = true,
  fileEntry,
  level = 0,
  selectPrevious = () => {},
  selectNext = () => {},
  closeParent = () => {},
}: Props): JSX.Element {
  const styles = useStyles({ level });
  const selectedFolder = useSelector(selectSelectedFolder);
  const autoSelectLast = useSelector(selectAutoSelectLastFolder);
  const openFolders = useSelector(selectOpenFolders);
  const dispatch = useDispatch();

  const subFolders = useMemo(() => {
    return fileEntry.children && filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children]);

  const isSelected = fileEntry === selectedFolder;
  const isOpen = openFolders[fileEntry.fullPath] || isRoot;

  const arrowLeft = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (isOpen) {
      dispatch(closeFolder(fileEntry));
    } else {
      closeParent();
    }
  };
  const arrowRight = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (!isOpen) {
      dispatch(openFolder(fileEntry));
    }
  };
  const arrowUp = (event: React.KeyboardEvent) => {
    event.preventDefault();
    selectPrevious();
  };
  const arrowDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    const firstFolder = isOpen && findFirstFolder(fileEntry);
    if (firstFolder) {
      dispatch(setSelectedFolder(firstFolder));
    } else {
      selectNext();
    }
  };

  useEventListener(
    'keydown',
    (event: React.KeyboardEvent) => {
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
    },
    window,
    isSelected
  );

  useEffect(() => {
    if (isSelected && isOpen && autoSelectLast) {
      const lastFolder = findLastFolder(fileEntry);
      if (lastFolder) {
        dispatch(setSelectedFolder(lastFolder));
      }
    }
  }, [isSelected]);

  function onChangeOpen() {
    dispatch(isOpen ? closeFolder(fileEntry) : openFolder(fileEntry));
  }

  function createSelectPrevious(index: number) {
    return () => {
      if (subFolders && subFolders[index - 1]) {
        dispatch(setSelectedFolder({ folder: subFolders[index - 1], autoSelectLast: true }));
      } else {
        dispatch(setSelectedFolder(fileEntry));
      }
    };
  }

  function createSelectNext(index: number) {
    return () => {
      if (subFolders && subFolders[index + 1]) {
        dispatch(setSelectedFolder(subFolders[index + 1]));
      } else {
        selectNext();
      }
    };
  }

  return (
    <>
      <div
        className={classNames(styles.entry, {
          [styles.selected]: isSelected,
        })}
        onClick={() => {
          dispatch(setSelectedFolder(fileEntry));
        }}
      >
        <FolderName
          {...{
            fileEntry,
            subFolders,
            level,
            isSelected,
            isOpen,
            onChangeOpen,
          }}
        />
      </div>
      {isOpen &&
        subFolders &&
        subFolders.map(
          (child, index) =>
            child.isFolder && (
              <Folder
                key={child.fullPath}
                isRoot={false}
                fileEntry={child}
                level={level + 1}
                selectPrevious={createSelectPrevious(index)}
                selectNext={createSelectNext(index)}
                closeParent={() => {
                  dispatch(closeFolder(fileEntry));
                  dispatch(setSelectedFolder(fileEntry));
                }}
              />
            )
        )}
    </>
  );
}
