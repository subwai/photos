import Promise from 'bluebird';
import classNames from 'classnames';
import { throttle } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import uuid from 'uuid';
import useFileEventListener from '../../../hooks/useFileEventListener';
import useThumbnail from '../../../hooks/useThumbnail';
import FileEntry, { FileEntryModel, findFirstImageOrVideo, isImage, isVideo } from '../../../models/FileEntry';
import FileSystemService from '../../../utils/FileSystemService';

export const THUMBNAIL_PADDING = 6;
export const THUMBNAIL_SIZE = 100;
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

export default function GridFolderThumbnail({ fileEntry }: Props): JSX.Element | null {
  const classes = useStyles();
  const preview = useMemo(() => findFirstImageOrVideo(fileEntry), [fileEntry.children]);
  const getChildrenPromise = useRef<Promise<FileEntry[]>>();
  const [, triggerUpdate] = useState<string>(uuid.v4());
  const [fullPath, key, setRequestThumbnail] = useThumbnail(preview);

  const triggerUpdateThrottled = useMemo(() => throttle(() => triggerUpdate(uuid.v4()), 2000), [triggerUpdate]);
  useFileEventListener('all', triggerUpdateThrottled, fileEntry);

  useEffect(() => {
    if (fileEntry.isFolder && fileEntry.children === null) {
      getChildrenPromise.current = FileSystemService.getChildren(fileEntry.fullPath);
      getChildrenPromise.current.then((children) => fileEntry.addChildren(children)).catch(console.error);
    }

    return () => getChildrenPromise.current?.cancel();
  }, []);

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

  return <i className={classNames(classes.folderIcon, 'fas fa-folder')} />;
}
