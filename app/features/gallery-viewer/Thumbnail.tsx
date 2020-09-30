import React, { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import sha1 from 'sha1';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import url from 'url';
import Bluebird from 'bluebird';
import FileEntry, { isVideo } from '../../utils/FileEntry';

const useStyles = createUseStyles({
  image: {
    padding: 8,
    margin: '0 2px',
    borderRadius: 5,
    imageRendering: 'pixelated',
    background: 'rgba(0,0,0,.2)',
    objectFit: 'contain',
    boxSizing: 'border-box',
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
  selected: {
    background: 'rgba(0,0,0,.6)',
  },
});

interface Props {
  fileEntry: FileEntry;
  cachePath: string | null;
  isSelected: boolean;
  onClick: (event: React.MouseEvent) => void;
  style: object;
}

export default function Thumbnail({ fileEntry, cachePath, isSelected, onClick, style }: Props): JSX.Element | null {
  const styles = useStyles();
  const [key, setKey] = useState<string | undefined>(undefined);
  const [requestThumbnail, setRequestThumbnail] = useState(false);

  useEffect(() => {
    let promise = Bluebird.resolve();

    if (requestThumbnail) {
      promise = Bluebird.resolve()
        .then(() => ipcRenderer.invoke('generate-thumbnail', fileEntry))
        .then(() => setKey(uuidv4()))
        .catch(console.error);
    }

    return () => promise.cancel();
  }, [requestThumbnail]);

  if (isVideo(fileEntry) && cachePath) {
    return (
      <img
        key={key}
        className={classNames(styles.image, { [styles.selected]: isSelected })}
        alt=""
        src={url.pathToFileURL(path.join(cachePath, 'thumbs', `${sha1(fileEntry.fullPath)}.png`)).toString()}
        onError={() => setRequestThumbnail(true)}
        onClick={onClick}
        style={style}
        loading="lazy"
      />
    );
  }

  return (
    <img
      className={classNames(styles.image, { [styles.selected]: isSelected })}
      alt=""
      src={url.pathToFileURL(fileEntry.fullPath).toString()}
      onClick={onClick}
      style={style}
      loading="lazy"
    />
  );
}
