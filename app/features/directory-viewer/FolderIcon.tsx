import React, { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import url from 'url';
import FileEntry, { findFirstImage } from '../../utils/FileEntry';

const useStyles = createUseStyles({
  previewIcon: {
    marginRight: 5,
    width: 32,
    height: 32,
    verticalAlign: 'middle',
    borderRadius: 5,
    imageRendering: 'pixelated',
    background: 'rgba(0,0,0,.3)',
    objectFit: 'contain',
  },
  folderIcon: {
    width: 34,
    marginRight: 5,
    fontSize: 22,
    textAlign: 'center',
    verticalAlign: 'middle',
    composes: 'fas',
  },
});

interface Props {
  fileEntry: FileEntry;
}

export default function FolderIcon({ fileEntry }: Props): JSX.Element {
  const styles = useStyles();
  const preview = useMemo(() => findFirstImage(fileEntry), [fileEntry.children]);

  if (preview) {
    return <img className={styles.previewIcon} alt="Preview" src={url.pathToFileURL(preview.fullPath).toString()} />;
  }

  return <i className={classNames(styles.folderIcon, 'fa-folder')} />;
}
