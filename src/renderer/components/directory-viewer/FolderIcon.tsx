import React, { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import FileEntry, { findFirstImageOrVideo, isImage, isVideo } from '../../utils/FileEntry';
import useThumbnail from '../../utils/useThumbnail';

const useStyles = createUseStyles({
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 5,
    padding: '0 4px',
    verticalAlign: 'middle',
    imageRendering: 'pixelated',
    background: 'rgba(0,0,0,.3)',
    objectFit: 'cover',
    position: 'relative',
    '&:after': {
      content: '"\\f1c5"',
      fontSize: 32,
      fontFamily: "'Font Awesome 5 Free'",
      color: '#333',
      display: 'inline-flex',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#222',
      justifyContent: 'center',
      alignItems: 'center',
    },
  },
  folderIcon: {
    width: 32,
    height: 32,
    padding: '0 4px',
    lineHeight: '32px',
    fontSize: 22,
    textAlign: 'center',
    verticalAlign: 'middle',
    composes: 'fas',
  },
});

interface Props {
  fileEntry: FileEntry;
}

export default function FolderIcon({ fileEntry }: Props): JSX.Element | null {
  const classes = useStyles();
  const preview = useMemo(() => findFirstImageOrVideo(fileEntry), [fileEntry.children]);
  const [fullPath, key, setRequestThumbnail] = useThumbnail(preview);

  if (preview && isVideo(preview)) {
    return (
      <img
        key={key}
        className={classes.previewIcon}
        alt=""
        src={fullPath}
        onError={() => setRequestThumbnail('video')}
      />
    );
  }

  if (preview && isImage(preview)) {
    return (
      <img
        key={key}
        className={classes.previewIcon}
        alt=""
        src={fullPath}
        onError={() => setRequestThumbnail('image')}
      />
    );
  }

  return <i className={classNames(classes.folderIcon, 'fa-folder')} />;
}
