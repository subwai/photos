import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Bluebird from 'bluebird';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import url from 'url';
import path from 'path';
import sha1 from 'sha1';
import { includes } from 'lodash';
import { selectCachePath } from '../features/rootFolderSlice';
import FileEntry, { isImage } from './FileEntry';

const ignore = ['.gif'];

function isIgnored(fileEntry?: FileEntry | null) {
  return fileEntry && includes(ignore, path.extname(fileEntry.name).toLowerCase());
}

export default function useThumbnail(
  fileEntry?: FileEntry | null
): [string | undefined, string | undefined, React.Dispatch<React.SetStateAction<string | null>>] {
  const [key, setKey] = useState<string | undefined>(undefined);
  const [requestThumbnail, setRequestThumbnail] = useState<string | null>(null);
  const [useOriginal, setUseOriginal] = useState(isIgnored(fileEntry));
  const cachePath = useSelector(selectCachePath);

  useEffect(() => {
    if (isIgnored(fileEntry)) {
      setUseOriginal(true);
    }
  }, [fileEntry]);

  useEffect(() => {
    let promise = Bluebird.resolve();

    if (requestThumbnail && !useOriginal && fileEntry) {
      promise = Bluebird.resolve()
        .then(() => ipcRenderer.invoke(`generate-${requestThumbnail}-thumbnail`, fileEntry))
        .then(() => setKey(uuidv4()))
        .catch(() => setUseOriginal(true));
    }

    return () => promise.cancel();
  }, [requestThumbnail, useOriginal, fileEntry]);

  let fullPath;
  if (!fileEntry) {
    fullPath = undefined;
  } else if (useOriginal) {
    fullPath = fileEntry.fullPath;
  } else if (!cachePath) {
    fullPath = isImage(fileEntry) ? fileEntry.fullPath : undefined;
  } else {
    const extension = isImage(fileEntry) ? path.extname(fileEntry.name) : '.jpg';
    fullPath = `${url
      .pathToFileURL(path.join(cachePath, 'thumbs', `${sha1(fileEntry.fullPath)}${extension}`))
      .toString()}#${fileEntry.fullPath}`;
  }

  return [fullPath, key, setRequestThumbnail];
}
