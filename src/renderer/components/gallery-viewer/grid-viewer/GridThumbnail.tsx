import classNames from 'classnames';
import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';
import useThumbnail from '../../../hooks/useThumbnail';
import { FileEntryModel, isVideo } from '../../../models/FileEntry';
import GridFolderThumbnail, { THUMBNAIL_PADDING, THUMBNAIL_WIDTH } from './GridFolderThumbnail';

const useStyles = createUseStyles({
  thumbnail: {
    padding: THUMBNAIL_PADDING,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    objectFit: 'contain',
    boxSizing: 'border-box',
    cursor: 'pointer',
    overflow: 'hidden',
    '&:after': {
      content: '"\\f1c5"',
      fontSize: 48,
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
  folderName: {
    position: 'absolute',
    width: THUMBNAIL_WIDTH,
    height: 12,
    lineHeight: '12px',
    fontSize: 12,
    left: THUMBNAIL_PADDING,
    bottom: THUMBNAIL_PADDING,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    textShadow: '0 1px 2px #333',
    padding: '0 2px',
    boxSizing: 'border-box',
  },
});

interface Props {
  fileEntry: FileEntryModel;
  index: number;
  onClick: (event: React.MouseEvent) => void;
  style: object;
}

export default memo(function GridThumbnail({ fileEntry, index, onClick, style }: Props): JSX.Element | null {
  const classes = useStyles();
  const [fullPath, key, setRequestThumbnail] = useThumbnail(fileEntry);

  if (isVideo(fileEntry)) {
    return (
      <div className={classes.thumbnail} style={style}>
        <img
          key={key}
          className={classNames(classes.image, `file-${index}`)}
          alt=""
          src={fullPath}
          onError={() => setRequestThumbnail('video')}
          onClick={onClick}
          loading="lazy"
        />
      </div>
    );
  }

  if (fileEntry.isFolder) {
    return (
      <div className={classes.thumbnail} style={style}>
        <GridFolderThumbnail fileEntry={fileEntry} />
        <span className={classes.folderName}>{fileEntry.name}</span>
      </div>
    );
  }

  return (
    <div className={classes.thumbnail} style={style}>
      <img
        key={key}
        className={classNames(classes.image, `file-${index}`)}
        alt=""
        src={fullPath}
        onError={() => setRequestThumbnail('image')}
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
});
