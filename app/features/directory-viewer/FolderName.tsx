import classNames from 'classnames';
import React from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import FolderIcon from './FolderIcon';
import FileEntry from '../../utils/FileEntry';
import { selectHiddenFolders, toggleHiddenFolder } from '../hiddenFoldersSlice';

const useStyles = createUseStyles({
  caretIcon: {
    width: 24,
    height: 32,
    fontSize: 16,
    lineHeight: '32px',
    textAlign: 'center',
    verticalAlign: 'middle',
    display: 'inline-block',
    boxSizing: 'border-box',
    composes: 'fas',
  },
  eyeIcon: {
    color: ({ hidden }) => (hidden ? 'rgba(200,200,200,.5)' : 'inherit'),
    composes: '$caretIcon fas',
  },
});

interface Props {
  fileEntry: FileEntry;
  subFolders: FileEntry[] | null;
  isSelected: boolean;
  open: boolean;
  onChangeOpen: () => void;
}

export default function FolderName({ fileEntry, subFolders, isSelected, open, onChangeOpen }: Props): JSX.Element {
  const dispatch = useDispatch();
  const hiddenFolders = useSelector(selectHiddenFolders);
  const hidden = hiddenFolders[fileEntry.fullPath] && !isSelected;
  const styles = useStyles({ hidden });

  function onChangeVisibility(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isSelected) {
      dispatch(toggleHiddenFolder(fileEntry.fullPath));
    }
  }

  return (
    <>
      {subFolders && subFolders.length > 0 ? (
        <i
          className={classNames(styles.caretIcon, { 'fa-caret-down': open, 'fa-caret-right': !open })}
          onClick={onChangeOpen}
        />
      ) : (
        <span className={styles.caretIcon} />
      )}
      <i
        className={classNames(styles.eyeIcon, {
          'fa-eye': !hidden,
          'fa-eye-slash': hidden,
        })}
        onClick={onChangeVisibility}
      />
      <FolderIcon fileEntry={fileEntry} />
      {fileEntry.name}
    </>
  );
}
