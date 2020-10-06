import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createUseStyles } from 'react-jss';
import { filter } from 'lodash';
import { selectHiddenFolders, selectOpenFolders, toggleHiddenFolder } from '../folderVisibilitySlice';
import { selectSelectedFolder } from '../selectedFolderSlice';
import FileEntry from '../../utils/FileEntry';

const useStyles = createUseStyles({
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
  fileEntry: FileEntry;
}

export default function FolderVisibility({ isRoot = true, fileEntry }: Props): JSX.Element {
  const dispatch = useDispatch();
  const selectedFolder = useSelector(selectSelectedFolder);
  const hiddenFolders = useSelector(selectHiddenFolders);
  const openFolders = useSelector(selectOpenFolders);
  const isSelected = fileEntry === selectedFolder;
  const isOpen = openFolders[fileEntry.fullPath] || isRoot;
  const hidden = hiddenFolders[fileEntry.fullPath] && !isSelected;
  const styles = useStyles({ hidden });

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
        className={classNames(styles.eyeIcon, {
          'fa-eye': !hidden,
          'fa-eye-slash': hidden,
        })}
        onClick={onChangeVisibility}
      />
      {isOpen &&
        subFolders &&
        subFolders.map(
          (child) => child.isFolder && <FolderVisibility key={child.fullPath} fileEntry={child} isRoot={false} />
        )}
    </>
  );
}
