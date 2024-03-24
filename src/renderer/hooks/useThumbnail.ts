import Bluebird from 'bluebird';
import { includes } from 'lodash';
import path from 'path';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import sha1 from 'sha1';
import { v4 as uuid4 } from 'uuid';

import { CoverEntryObject, FileEntryModel, isImage, isVideo } from 'renderer/models/FileEntry';
import { selectCachePath } from 'renderer/redux/slices/rootFolderSlice';
import PromiseQueue from 'renderer/utils/PromiseQueue';

const ignore = ['.gif'];

const queue = new PromiseQueue({ concurrency: 15 });

function isIgnored(fileEntry?: FileEntryModel | CoverEntryObject | null) {
  return !!(fileEntry && includes(ignore, path.extname(fileEntry.name).toLowerCase()));
}

export default function useThumbnail(
  fileEntry?: FileEntryModel | CoverEntryObject | null,
): [string | undefined, string, () => void] {
  const [key, updateRenderKey] = useState<string>(uuid4());
  const [thumbnailRequested, triggerThumbnailRequest] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const cachePath = useSelector(selectCachePath);

  useEffect(() => {
    let promise: Bluebird<void>;

    if (thumbnailRequested && fileEntry && !useOriginal && !isIgnored(fileEntry)) {
      promise = queue.add(() => {
        return Bluebird.resolve()
          .then(() =>
            window.electron.invoke(
              `generate-${getThumbnailType(fileEntry)}-thumbnail`,
              'values' in fileEntry ? fileEntry.values() : fileEntry,
            ),
          )
          .then(() => updateRenderKey(uuid4()))
          .catch(() => setUseOriginal(true));
      });
    }

    return () => promise?.cancel();
  }, [thumbnailRequested, useOriginal, fileEntry]);

  let fullPath;
  if (!fileEntry) {
    fullPath = undefined;
  } else if (useOriginal) {
    fullPath = isVideo(fileEntry) ? undefined : window.electron.pathToFileURL(fileEntry.fullPath);
  } else if (isIgnored(fileEntry)) {
    fullPath = window.electron.pathToFileURL(fileEntry.fullPath);
  } else if (!cachePath) {
    fullPath = isImage(fileEntry) ? window.electron.pathToFileURL(fileEntry.fullPath) : undefined;
  } else {
    const extension = isVideo(fileEntry) ? '.jpg' : '.webp';
    fullPath = `${window.electron.pathToFileURL(
      path.join(cachePath, 'thumbs', `${sha1(fileEntry.fullPath)}${extension}`),
    )}#${fileEntry.fullPath}`;
  }

  const generateThumbnail = useCallback(() => {
    triggerThumbnailRequest(true);
  }, [triggerThumbnailRequest]);

  return [fullPath, key, generateThumbnail];
}

function getThumbnailType(fileEntry: FileEntryModel | CoverEntryObject) {
  if (isVideo(fileEntry)) {
    return 'video';
  }
  if (isImage(fileEntry)) {
    return 'image';
  }

  return null;
}
