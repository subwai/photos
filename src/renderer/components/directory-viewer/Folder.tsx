import classNames from 'classnames';
import React, { ComponentProps, memo } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';

import FolderName from 'renderer/components/directory-viewer/FolderName';
import useAutomaticCoverLoader from 'renderer/hooks/useAutomaticCoverLoader';
import type { FileEntryModel } from 'renderer/models/FileEntry';
import { closeFolder, openFolder, selectOpenFolders } from 'renderer/redux/slices/folderVisibilitySlice';
import { selectRootFolder } from 'renderer/redux/slices/rootFolderSlice';

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
  isSelected: boolean;
  fileEntry: FileEntryModel;
  onClick: (entry: FileEntryModel) => void;
  style: ComponentProps<'div'>['style'];
}

export default memo(function Folder({ isSelected, fileEntry, onClick, style }: Props): JSX.Element {
  const rootFolder = useSelector(selectRootFolder);
  const openFolders = useSelector(selectOpenFolders);
  const classes = useStyles({ level: fileEntry.level });
  const dispatch = useDispatch();

  useAutomaticCoverLoader(fileEntry);

  const isRoot = fileEntry === rootFolder;
  const isOpen = openFolders[fileEntry.fullPath] || isRoot;

  function onChangeOpen(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    dispatch(isOpen ? closeFolder(fileEntry) : openFolder(fileEntry));
  }

  return (
    <div
      className={classNames(classes.entry, `folder-${fileEntry.objectPath}`, 'folder-size')}
      onClick={() => onClick(fileEntry)}
      style={style}
    >
      <FolderName
        {...{
          fileEntry,
          isSelected,
          isOpen,
          onChangeOpen,
        }}
      />
    </div>
  );
});
