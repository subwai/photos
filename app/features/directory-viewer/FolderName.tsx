import classNames from 'classnames';
import React from 'react';
import { createUseStyles } from 'react-jss';
import FolderIcon from './FolderIcon';
import FileEntry from '../../utils/FileEntry';

const useStyles = createUseStyles({
  caretIcon: {
    width: 15,
    height: 15,
    fontSize: 16,
    padding: 8,
    textAlign: 'center',
    display: 'inline-block',
    verticalAlign: 'middle',
    composes: 'fas',
  },
});

interface Props {
  fileEntry: FileEntry;
  subFolders: FileEntry[] | null;
  open: boolean;
  handleCaretClick: () => void;
}

export default function FolderName({ fileEntry, subFolders, open, handleCaretClick }: Props): JSX.Element {
  const styles = useStyles();

  if (open) {
    return (
      <>
        {subFolders && subFolders.length > 0 ? (
          <i className={classNames(styles.caretIcon, 'fa-caret-down')} onClick={handleCaretClick} />
        ) : (
          <span className={styles.caretIcon} />
        )}
        <FolderIcon fileEntry={fileEntry} />
        {fileEntry.name}
      </>
    );
  }

  return (
    <>
      {subFolders && subFolders.length > 0 ? (
        <i className={classNames(styles.caretIcon, 'fa-caret-right')} onClick={handleCaretClick} />
      ) : (
        <span className={styles.caretIcon} />
      )}
      <FolderIcon fileEntry={fileEntry} />
      {fileEntry.name}
    </>
  );
}
