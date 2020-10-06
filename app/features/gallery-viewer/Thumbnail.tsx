import React, { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import sha1 from 'sha1';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import url from 'url';
import Bluebird from 'bluebird';
import { useSelector } from 'react-redux';
import FileEntry, { isVideo } from '../../utils/FileEntry';
import { selectCachePath } from '../rootFolderSlice';

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
  const [key, setKey] = useState<string | undefined>(undefined);
  const [requestThumbnail, setRequestThumbnail] = useState(false);
  const cachePath = useSelector(selectCachePath);

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
        className={classNames(styles.image, `file-${index}`)}
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
      className={classNames(styles.image, `file-${index}`)}
      alt=""
      src={url.pathToFileURL(fileEntry.fullPath).toString()}
      onClick={onClick}
      style={style}
      loading="lazy"
    />
  );
}
