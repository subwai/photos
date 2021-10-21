import Bluebird from 'bluebird';
import { includes } from 'lodash';
import path from 'path';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import sha1 from 'sha1';
import { v4 as uuid4 } from 'uuid';
import { FileEntryModel, isImage, isVideo } from '../models/FileEntry';
import { selectCachePath } from '../redux/slices/rootFolderSlice';
import PromiseQueue from '../utils/PromiseQueue';

const ignore = ['.gif'];

const queue = new PromiseQueue({ concurrency: 15 });

function isIgnored(fileEntry?: FileEntryModel | null) {
  return fileEntry && includes(ignore, path.extname(fileEntry.name).toLowerCase());
}

export default function useThumbnail(
  fileEntry?: FileEntryModel | null
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
      promise = queue.add(() => {
        return Bluebird.resolve()
          .then(() => window.electron.invoke(`generate-${requestThumbnail}-thumbnail`, fileEntry.values()))
          .then(() => setKey(uuid4()))
          .catch(() => setUseOriginal(true));
      });
    }

    return () => promise.cancel();
  }, [requestThumbnail, useOriginal, fileEntry]);

  let fullPath;
  if (!fileEntry) {
    fullPath = undefined;
  } else if (useOriginal) {
    fullPath = window.electron.pathToFileURL(fileEntry.fullPath);
  } else if (!cachePath) {
    fullPath = isImage(fileEntry) ? window.electron.pathToFileURL(fileEntry.fullPath) : undefined;
  } else {
    const extension = isVideo(fileEntry) ? '.jpg' : '.webp';
    fullPath = `${window.electron.pathToFileURL(
      path.join(cachePath, 'thumbs', `${sha1(fileEntry.fullPath)}${extension}`)
    )}#${fileEntry.fullPath}`;
  }

  return [fullPath, key, setRequestThumbnail];
}
