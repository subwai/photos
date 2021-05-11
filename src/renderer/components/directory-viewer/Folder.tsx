import React, { useEffect, useMemo, memo, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { filter } from 'lodash';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';

import Promise from 'bluebird';
import FileEntry, { findLastFolder } from '../../models/FileEntry';
import FolderName from './FolderName';
import { selectAutoSelectLastFolder, setSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';
import { selectFolderSize } from '../../redux/slices/folderSizeSlice';
import FileSystemService from '../../utils/FileSystemService';
import { selectFolder, updateFile } from '../../redux/slices/rootFolderSlice';

const useStyles = createUseStyles<string, { level: number }>({
  root: {
    marginLeft: 0,
    width: 'calc(100% - 1px)',
  },
  entry: {
    display: 'flex',
    padding: 4,
    boxSizing: 'border-box',
    fontSize: 14,
    alignItems: 'center',
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
  isSelected: boolean;
  index: number;
  objectPath?: string;
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
  onClick: (index: number) => void;
}

export default memo(function Folder({ index, isSelected, objectPath, onClick }: Props): JSX.Element {
  const autoSelectLast = useSelector(selectAutoSelectLastFolder);
  const openFolders = useSelector(selectOpenFolders);
  const height = useSelector(selectFolderSize);
  const fileEntry = useSelector(selectFolder(objectPath));
  const classes = useStyles({ level: fileEntry.level });
  const getChildrenPromise = useRef<Promise<FileEntry[]>>();
  const dispatch = useDispatch();

  const isRoot = objectPath === undefined;

  useEffect(() => {
    if (fileEntry.isFolder && fileEntry.children === null) {
      getChildrenPromise.current = FileSystemService.getChildren(fileEntry.fullPath);
      getChildrenPromise.current
        .then((children) => dispatch(updateFile({ ...fileEntry, children })))
        .catch(console.error);
    }

    return () => getChildrenPromise.current?.cancel();
  }, []);

  const subFolders = useMemo(() => {
    return fileEntry.children && filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children]);

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
      <div className={classNames(classes.entry, `folder-${index}`)} style={{ height }} onClick={() => onClick(index)}>
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
