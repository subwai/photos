import classNames from 'classnames';
import type { MouseEvent } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';

import FolderIcon from 'renderer/components/directory-viewer/FolderIcon';
import type { FileEntryModel } from 'renderer/models/FileEntry';
import { selectHiddenFolders, toggleHiddenFolder } from 'renderer/redux/slices/folderVisibilitySlice';

const useStyles = createUseStyles<string, { hidden: boolean }>({
  container: {
    flex: 1,
  },
  icon: {
    fontSize: 16,
    padding: '8px 4px',
    textAlign: 'center',
    verticalAlign: 'middle',
    display: 'inline-table',
    boxSizing: 'border-box',
  },
  caretIcon: {
    width: 18,
    minWidth: 18,
    composes: '$icon fas',
  },
  eyeIcon: {
    color: ({ hidden }) => (hidden ? 'rgba(200,200,200,.5)' : 'inherit'),
    composes: '$icon fas',
  },
  name: {
    flex: 1,
    textOverflow: 'ellipsis',
    padding: '0 4px',
  },
});

interface Props {
  fileEntry: FileEntryModel;
  isSelected: boolean;
  isOpen: boolean;
  onChangeOpen: (event: MouseEvent) => void;
}

export default function FolderName({ fileEntry, isSelected, isOpen, onChangeOpen }: Props): JSX.Element {
  const hiddenFolders = useSelector(selectHiddenFolders);
  const hidden = hiddenFolders[fileEntry.fullPath] && !isSelected;
  const classes = useStyles({ hidden });
  const dispatch = useDispatch();

  function onChangeVisibility(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isSelected) {
      dispatch(toggleHiddenFolder(fileEntry));
    }
  }

  return (
    <>
      {fileEntry.isFolder ? (
        <i
          className={classNames(classes.caretIcon, { 'fa-caret-down': isOpen, 'fa-caret-right': !isOpen })}
          style={{ marginLeft: fileEntry.level * 10 }}
          onClick={onChangeOpen}
        />
      ) : (
        <span className={classes.caretIcon} style={{ marginLeft: fileEntry.level * 10 }} />
      )}
      <FolderIcon fileEntry={fileEntry} />
      <i
        key={fileEntry.fullPath}
        className={classNames(classes.eyeIcon, {
          'fa-eye': !hidden,
          'fa-eye-slash': hidden,
        })}
        onClick={onChangeVisibility}
      />
      <span className={classes.name}>{fileEntry.name.replace(':', '/')}</span>
    </>
  );
}
