import React from 'react';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import FileEntry, { isVideo } from '../../utils/FileEntry';
import useThumbnail from '../../utils/useThumbnail';

const useStyles = createUseStyles({
  image: {
    padding: 6,
    borderRadius: 5,
    imageRendering: 'pixelated',
    objectFit: 'contain',
    boxSizing: 'border-box',
    cursor: 'pointer',
    '&:after': {
      content: '"\\f1c5"',
      fontSize: 48,
      fontFamily: 'Font Awesome 5 Free',
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
  fileEntry: FileEntry;
  index: number;
  onClick: (event: React.MouseEvent) => void;
  style: object;
}

export default function Thumbnail({ fileEntry, index, onClick, style }: Props): JSX.Element | null {
  const styles = useStyles();
  const [fullPath, key, setRequestThumbnail] = useThumbnail(fileEntry);

  if (isVideo(fileEntry)) {
    return (
      <img
        key={key}
        className={classNames(styles.image, `file-${index}`)}
        alt=""
        src={fullPath}
        onError={() => setRequestThumbnail('video')}
        onClick={onClick}
        style={style}
        loading="lazy"
      />
    );
  }

  return (
    <img
      key={key}
      className={classNames(styles.image, `file-${index}`)}
      alt=""
      src={fullPath}
      onError={() => setRequestThumbnail('image')}
      onClick={onClick}
      style={style}
      loading="lazy"
    />
  );
}
