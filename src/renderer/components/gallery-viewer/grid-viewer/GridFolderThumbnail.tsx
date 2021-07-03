import classNames from 'classnames';
import React, { memo, useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import useAutomaticChildrenLoader from '../../../hooks/useAutomaticChildrenLoader';
import useThumbnail from '../../../hooks/useThumbnail';
import { FileEntryModel, findFirstImageOrVideo, isImage, isVideoThumbnail } from '../../../models/FileEntry';

export const THUMBNAIL_PADDING = 6;
export const THUMBNAIL_SIZE = 200;
export const THUMBNAIL_HEIGHT = THUMBNAIL_SIZE - THUMBNAIL_PADDING * 2;
export const THUMBNAIL_WIDTH = Math.round(THUMBNAIL_HEIGHT * 0.85);

const useStyles = createUseStyles({
  previewIcon: {
    height: THUMBNAIL_HEIGHT,
    width: THUMBNAIL_WIDTH,
    borderRadius: 5,
    verticalAlign: 'middle',
    background: 'rgba(0,0,0,.3)',
    objectFit: 'cover',
    objectPosition: 'center 30%',
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
    fontSize: THUMBNAIL_WIDTH,
    textAlign: 'center',
    verticalAlign: 'middle',
    marginTop: -6,
  },
});

interface Props {
  fileEntry: FileEntryModel;
}

export default memo(function GridFolderThumbnail({ fileEntry }: Props): JSX.Element | null {
  const classes = useStyles();
  const updated = useAutomaticChildrenLoader(fileEntry);
  const preview = useMemo(() => findFirstImageOrVideo(fileEntry), [updated]);
  const [fullPath, key, setRequestThumbnail] = useThumbnail(preview);

  if (preview && isVideoThumbnail(preview)) {
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

  return <i className={classNames(classes.folderIcon, 'fas fa-folder')} />;
});
