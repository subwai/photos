import React, { useEffect, useMemo, memo } from 'react';
import { createUseStyles } from 'react-jss';
import { filter } from 'lodash';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';

import FileEntry, { findLastFolder } from '../../models/FileEntry';
import FolderName from './FolderName';
import { selectAutoSelectLastFolder, selectSelectedFolder, setSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';

const useStyles = createUseStyles({
  root: {
    marginLeft: 0,
    width: 'calc(100% - 1px)',
  },
  entry: {
    display: 'flex',
    height: 40,
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
  index: number;
  fileEntry: FileEntry;
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
  onClick?: (event: React.MouseEvent) => void;
}

export default memo(function Folder({ isRoot = true, index, fileEntry, onClick }: Props): JSX.Element {
  const classes = useStyles({ level: fileEntry.level });
  const selectedFolderPath = useSelector(selectSelectedFolder);
  const autoSelectLast = useSelector(selectAutoSelectLastFolder);
  const openFolders = useSelector(selectOpenFolders);
  const dispatch = useDispatch();

  const subFolders = useMemo(() => {
    return fileEntry.children && filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children]);

  const isSelected = fileEntry.fullPath === selectedFolderPath;
  const isOpen = openFolders[fileEntry.fullPath] || isRoot;

  useEffect(() => {
    if (isSelected && isOpen && autoSelectLast) {
      const lastFolder = findLastFolder(fileEntry);
      if (lastFolder) {
        dispatch(setSelectedFolder(lastFolder));
      }
    }
  }, [isSelected]);

  function onChangeOpen(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch(isOpen ? closeFolder(fileEntry) : openFolder(fileEntry));
  }

  return (
    <>
      <div className={classNames(classes.entry, `folder-${index}`)} onClick={onClick}>
        <FolderName
          {...{
            fileEntry,
            subFolders,
            isSelected,
            isOpen,
            onChangeOpen,
          }}
        />
      </div>
    </>
  );
});
