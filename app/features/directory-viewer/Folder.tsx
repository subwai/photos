import React, { useEffect, useMemo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import _ from 'lodash';
import classNames from 'classnames';

import FileEntry, { findFirstFolder, findLastFolder } from '../../utils/FileEntry';
import FolderName from './FolderName';
import useEventListener from '../../utils/useEventListener';

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
      background: 'rgba(0,0,0,.3)',
    },
  },
  selected: {
    background: 'rgba(0,0,0,.45)',
  },
});

interface Props {
  isRoot?: boolean;
  fileEntry: FileEntry;
  selectedFolder: FileEntry | null;
  autoSelectLast: boolean;
  onSelect: (arg0: FileEntry, arg1?: boolean) => void;
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
}

export default function Folder({
  isRoot = true,
  fileEntry,
  selectedFolder,
  autoSelectLast,
  onSelect,
  selectPrevious = () => {},
  selectNext = () => {},
  closeParent = () => {},
}: Props): JSX.Element {
  const styles = useStyles();
  const [open, setOpen] = useState(isRoot);

  const subFolders = useMemo(() => {
    return fileEntry.children && _.filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children]);

  const isSelected = fileEntry === selectedFolder;

  const LEFT_ARROW = 37;
  const UP_ARROW = 38;
  const RIGHT_ARROW = 39;
  const DOWN_ARROW = 40;
  useEventListener(
    'keydown',
    (event: React.KeyboardEvent) => {
      if (event.keyCode === LEFT_ARROW && event.shiftKey) {
        event.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          closeParent();
        }
      }
      if (event.keyCode === RIGHT_ARROW && event.shiftKey) {
        event.preventDefault();
        if (!open) {
          setOpen(true);
        }
      }
      if (event.keyCode === UP_ARROW && !document.fullscreenElement) {
        event.preventDefault();
        selectPrevious();
      }
      if (event.keyCode === DOWN_ARROW && !document.fullscreenElement) {
        event.preventDefault();
        const firstFolder = open && findFirstFolder(fileEntry);
        if (firstFolder) {
          onSelect(firstFolder);
        } else {
          selectNext();
        }
      }
    },
    window,
    isSelected
  );

  useEffect(() => {
    if (isSelected && open && autoSelectLast) {
      const lastFolder = findLastFolder(fileEntry);
      if (lastFolder) {
        onSelect(lastFolder);
      }
    }
  }, [isSelected]);

  function handleSelect() {
    onSelect(fileEntry);
  }

  function handleCaretClick() {
    setOpen(!open);
  }

  function createSelectPrevious(index: number) {
    return () => {
      if (subFolders && subFolders[index - 1]) {
        onSelect(subFolders[index - 1], true);
      } else {
        onSelect(fileEntry);
      }
    };
  }

  function createSelectNext(index: number) {
    return () => {
      if (subFolders && subFolders[index + 1]) {
        onSelect(subFolders[index + 1]);
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
        onClick={handleSelect}
      >
        <FolderName
          {...{
            fileEntry,
            subFolders,
            open,
            handleCaretClick,
          }}
        />
      </li>
      {open &&
        subFolders &&
        subFolders.map(
          (child, index) =>
            !_.isEmpty(child.children) && (
              <Folder
                key={child.fullPath}
                isRoot={false}
                fileEntry={child}
                selectedFolder={selectedFolder}
                autoSelectLast={autoSelectLast}
                onSelect={onSelect}
                selectPrevious={createSelectPrevious(index)}
                selectNext={createSelectNext(index)}
                closeParent={() => {
                  setOpen(false);
                  onSelect(fileEntry);
                }}
              />
            )
        )}
    </ul>
  );
}
