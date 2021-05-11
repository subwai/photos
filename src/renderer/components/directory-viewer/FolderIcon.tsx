import React, { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { FileEntryModel, findFirstImageOrVideo, isImage, isVideo } from '../../models/FileEntry';
import useThumbnail from '../../hooks/useThumbnail';
import { selectFolderSize } from '../../redux/slices/folderSizeSlice';

const SIDE_MARGIN = 4;

const useStyles = createUseStyles({
  previewIcon: {
    height: '100%',
    borderRadius: 5,
    margin: `0 ${SIDE_MARGIN}px`,
    verticalAlign: 'middle',
    imageRendering: 'pixelated',
    background: 'rgba(0,0,0,.3)',
    objectFit: 'cover',
    aspectRatio: 1,
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
    margin: `0 ${SIDE_MARGIN}px`,
    textAlign: 'center',
    verticalAlign: 'middle',
    composes: 'fas',
  },
});

interface Props {
  fileEntry: FileEntryModel;
}

export default function FolderIcon({ fileEntry }: Props): JSX.Element | null {
  const classes = useStyles();
  const preview = useMemo(() => findFirstImageOrVideo(fileEntry), [fileEntry.children]);
  const [fullPath, key, setRequestThumbnail] = useThumbnail(preview);
  const height = useSelector(selectFolderSize);

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

  return <i className={classNames(classes.folderIcon, 'fa-folder')} style={{ fontSize: height - SIDE_MARGIN * 2 }} />;
}
