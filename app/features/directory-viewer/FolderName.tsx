import classNames from 'classnames';
import React from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import FolderIcon from './FolderIcon';
import FileEntry from '../../utils/FileEntry';
import { selectHiddenFolders, toggleHiddenFolder } from '../folderVisibilitySlice';

const useStyles = createUseStyles({
  container: {
    flex: 1,
  },
  icon: {
    height: 32,
    fontSize: 16,
    padding: '0 4px',
    lineHeight: '32px',
    textAlign: 'center',
    verticalAlign: 'middle',
    display: 'inline-block',
    boxSizing: 'border-box',
  },
  caretIcon: {
    width: 18,
    composes: '$icon fas',
  },
  eyeIcon: {
    color: ({ hidden }) => (hidden ? 'rgba(200,200,200,.5)' : 'inherit'),
    composes: '$icon fas',
  },
  name: {
    flex: 1,
    height: 32,
    lineHeight: '32px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '0 4px',
  },
});

interface Props {
  fileEntry: FileEntry;
  subFolders: FileEntry[] | null;
  isSelected: boolean;
  isOpen: boolean;
  onChangeOpen: (event: React.MouseEvent) => void;
}

export default function FolderName({ fileEntry, subFolders, isSelected, isOpen, onChangeOpen }: Props): JSX.Element {
  const hiddenFolders = useSelector(selectHiddenFolders);
  const hidden = hiddenFolders[fileEntry.fullPath] && !isSelected;
  const styles = useStyles({ hidden });
  const dispatch = useDispatch();

  function onChangeVisibility(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isSelected) {
      dispatch(toggleHiddenFolder(fileEntry));
    }
  }

  return (
    <>
      {subFolders && subFolders.length > 0 ? (
        <i
          className={classNames(styles.caretIcon, { 'fa-caret-down': isOpen, 'fa-caret-right': !isOpen })}
          style={{ marginLeft: fileEntry.level * 10 }}
          onClick={onChangeOpen}
        />
      ) : (
        <span className={styles.caretIcon} style={{ marginLeft: fileEntry.level * 10 }} />
      )}
      <FolderIcon fileEntry={fileEntry} />
      <i
        key={fileEntry.fullPath}
        className={classNames(styles.eyeIcon, {
          'fa-eye': !hidden,
          'fa-eye-slash': hidden,
        })}
        onClick={onChangeVisibility}
      />
      <span className={styles.name}>{fileEntry.name}</span>
    </>
  );
}
