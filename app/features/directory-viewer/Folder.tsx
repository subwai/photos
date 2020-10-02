import React, { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { filter, isEmpty } from 'lodash';
import classNames from 'classnames';

import { useDispatch, useSelector } from 'react-redux';
import FileEntry, { findFirstFolder, findLastFolder } from '../../utils/FileEntry';
import FolderName from './FolderName';
import useEventListener from '../../utils/useEventListener';
import { selectSelectedFolder, selectAutoSelectLastFolder, setSelectedFolder } from '../selectedFolderSlice';

const useStyles = createUseStyles({
  folder: {
    padding: 0,
    margin: 0,
    marginLeft: 10,
    borderRadius: 5,
  },
  root: {
    marginLeft: 0,
    width: 'max-content',
  },
  entry: {
    minWidth: '100%',
    height: 40,
    margin: '1px 0',
    lineHeight: '40px',
    fontSize: 14,
    borderRadius: 5,
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
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
}

export default function Folder({
  isRoot = true,
  fileEntry,
  selectPrevious = () => {},
  selectNext = () => {},
  closeParent = () => {},
}: Props): JSX.Element {
  const styles = useStyles();
  const [open, setOpen] = useState(isRoot);
  const selectedFolder = useSelector(selectSelectedFolder);
  const autoSelectLast = useSelector(selectAutoSelectLastFolder);
  const dispatch = useDispatch();

  const subFolders = useMemo(() => {
    return fileEntry.children && filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children]);

  const isSelected = fileEntry === selectedFolder;

  const arrowLeft = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (open) {
      setOpen(false);
    } else {
      closeParent();
    }
  };
  const arrowRight = (event: React.KeyboardEvent) => {
    event.preventDefault();
    if (!open) {
      setOpen(true);
    }
  };
  const arrowUp = (event: React.KeyboardEvent) => {
    event.preventDefault();
    selectPrevious();
  };
  const arrowDown = (event: React.KeyboardEvent) => {
    event.preventDefault();
    const firstFolder = open && findFirstFolder(fileEntry);
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
    if (isSelected && open && autoSelectLast) {
      const lastFolder = findLastFolder(fileEntry);
      if (lastFolder) {
        dispatch(setSelectedFolder(lastFolder));
      }
    }
  }, [isSelected]);

  function onChangeOpen() {
    setOpen(!open);
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
    <ul className={classNames(styles.folder, { [styles.root]: isRoot })}>
      <li
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
            isSelected,
            open,
            onChangeOpen,
          }}
        />
      </li>
      {open &&
        subFolders &&
        subFolders.map(
          (child, index) =>
            !isEmpty(child.children) && (
              <Folder
                key={child.fullPath}
                isRoot={false}
                fileEntry={child}
                selectPrevious={createSelectPrevious(index)}
                selectNext={createSelectNext(index)}
                closeParent={() => {
                  setOpen(false);
                  dispatch(setSelectedFolder(fileEntry));
                }}
              />
            )
        )}
    </ul>
  );
}
