import Promise from 'bluebird';
import classNames from 'classnames';
import { filter } from 'lodash';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { useThrottledCallback } from 'use-debounce';
import { v4 as uuid4 } from 'uuid';
import useFileEventListener from '../../hooks/useFileEventListener';
import FileEntryObject, { Children, FileEntryModel } from '../../models/FileEntry';
import { closeFolder, openFolder, selectOpenFolders } from '../../redux/slices/folderVisibilitySlice';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
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
  fileEntry: FileEntryModel;
  selectPrevious?: () => void;
  selectNext?: () => void;
  closeParent?: () => void;
  onClick: (entry: FileEntryModel) => void;
}

export default memo(function Folder({ isSelected, fileEntry, onClick }: Props): JSX.Element {
  const rootFolder = useSelector(selectRootFolder);
  const openFolders = useSelector(selectOpenFolders);
  const [update, triggerUpdate] = useState<string>(uuid4());
  const classes = useStyles({ level: fileEntry.level });
  const getChildrenPromise = useRef<Promise<Children<FileEntryObject>>>();
  const dispatch = useDispatch();

  const triggerUpdateThrottled = useThrottledCallback(() => triggerUpdate(uuid4()), 2000);
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

  const isRoot = fileEntry === rootFolder;
  const isOpen = openFolders[fileEntry.fullPath] || isRoot;

  function onChangeOpen(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch(isOpen ? closeFolder(fileEntry) : openFolder(fileEntry));
  }

  return (
    <>
      <div
        className={classNames(classes.entry, `folder-${fileEntry.objectPath}`, 'folder-size')}
        onClick={() => onClick(fileEntry)}
      >
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
