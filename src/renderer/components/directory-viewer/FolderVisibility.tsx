import classNames from 'classnames';
import { filter } from 'lodash';
import React, { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';

import useSelectedFolder from 'renderer/hooks/useSelectedFolder';
import type FileEntryObject from 'renderer/models/FileEntry';
import {
  selectHiddenFolders,
  selectOpenFolders,
  toggleHiddenFolder,
} from 'renderer/redux/slices/folderVisibilitySlice';

const useStyles = createUseStyles<string, { hidden: boolean }>({
  eyeIcon: {
    width: 32,
    height: 40,
    fontSize: 16,
    lineHeight: '32px',
    textAlign: 'center',
    verticalAlign: 'middle',
    display: 'block',
    boxSizing: 'border-box',
    padding: '4px 6px',
    margin: 1,
    color: ({ hidden }) => (hidden ? 'rgba(200,200,200,.5)' : 'inherit'),
    composes: 'fas',
  },
});

interface Props {
  isRoot?: boolean;
  fileEntry: FileEntryObject;
}

export default function FolderVisibility({ isRoot = true, fileEntry }: Props): JSX.Element {
  const dispatch = useDispatch();
  const [selectedFolder] = useSelectedFolder();
  const hiddenFolders = useSelector(selectHiddenFolders);
  const openFolders = useSelector(selectOpenFolders);
  const isSelected = fileEntry === selectedFolder;
  const isOpen = openFolders[fileEntry.fullPath] || isRoot;
  const hidden = hiddenFolders[fileEntry.fullPath] && !isSelected;
  const classes = useStyles({ hidden });

  const subFolders = useMemo(() => {
    return fileEntry.children && filter(fileEntry.children, 'isFolder');
  }, [fileEntry.children]);

  function onChangeVisibility(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isSelected) {
      dispatch(toggleHiddenFolder(fileEntry));
    }
  }

  return (
    <>
      <i
        key={fileEntry.fullPath}
        className={classNames(classes.eyeIcon, {
          'fa-eye': !hidden,
          'fa-eye-slash': hidden,
        })}
        onClick={onChangeVisibility}
      />
      {isOpen &&
        subFolders &&
        subFolders.map(
          (child) => child.isFolder && <FolderVisibility key={child.fullPath} fileEntry={child} isRoot={false} />,
        )}
    </>
  );
}
