import classNames from 'classnames';
import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';
import useThumbnail from '../../hooks/useThumbnail';
import { FileEntryModel, isVideo } from '../../models/FileEntry';

export const THUMBNAIL_PADDING = 6;

const useStyles = createUseStyles({
  thumbnail: {
    padding: '6px 0 2px',
    boxSizing: 'border-box',
  },
  image: {
    width: '100%',
    height: '100%',
    padding: THUMBNAIL_PADDING,
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
});

interface Props {
  fileEntry: FileEntryModel;
  index: number;
  onClick: (event: React.MouseEvent) => void;
  style: object;
}

export default memo(function Thumbnail({ fileEntry, index, onClick, style }: Props): JSX.Element | null {
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
