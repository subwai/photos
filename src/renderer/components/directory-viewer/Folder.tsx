import Promise from 'bluebird';
import classNames from 'classnames';
import { filter, throttle } from 'lodash';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import uuid from 'uuid';
import useFileEventListener from '../../hooks/useFileEventListener';
import FileEntry, { FileEntryModel, findLastFolder } from '../../models/FileEntry';
import { selectFolderSize } from '../../redux/slices/folderSizeSlice';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import { selectAutoSelectLastFolder, setSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import FileSystemService from '../../utils/FileSystemService';
import FolderName from './FolderName';

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
  fileEntry: FileEntryModel;
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
  onClick: (index: number) => void;
}

export default memo(function Folder({ index, isSelected, fileEntry, onClick }: Props): JSX.Element {
  const rootFolder = useSelector(selectRootFolder);
  const autoSelectLast = useSelector(selectAutoSelectLastFolder);
  const openFolders = useSelector(selectOpenFolders);
  const height = useSelector(selectFolderSize);
  const [update, triggerUpdate] = useState<string>(uuid.v4());
  const classes = useStyles({ level: fileEntry.level });
  const getChildrenPromise = useRef<Promise<FileEntry[]>>();
  const dispatch = useDispatch();

  const isRoot = fileEntry === rootFolder;

  const triggerUpdateThrottled = useMemo(() => throttle(() => triggerUpdate(uuid.v4()), 2000), [triggerUpdate]);
  useFileEventListener('all', triggerUpdateThrottled, fileEntry);

  useEffect(() => {
    if (fileEntry.isFolder && fileEntry.children === null) {
      getChildrenPromise.current = FileSystemService.getChildren(fileEntry.fullPath);
      getChildrenPromise.current.then((children) => fileEntry.addChildren(children)).catch(console.error);
    }

    return () => getChildrenPromise.current?.cancel();
  }, []);

  const subFolders = useMemo(() => {
    return fileEntry.children && filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children, update]);

  const isOpen = openFolders[fileEntry.fullPath] || isRoot;

  useEffect(() => {
    if (isSelected && isOpen && autoSelectLast) {
      const lastFolder = findLastFolder(fileEntry);
      if (lastFolder) {
        dispatch(setSelectedFolder(lastFolder));
      }
    }
  }, [isSelected, dispatch]);

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
