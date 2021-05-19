import Promise from 'bluebird';
import { defaults, values } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useThrottledCallback } from 'use-debounce';
import uuid from 'uuid';
import { FileEntryModel } from '../models/FileEntry';
import useFileEventListener from './useFileEventListener';

type Options = {
  deep?: boolean;
  priority?: number;
};

export default function useAutomaticChildrenLoader(selectedFolder: FileEntryModel | null, options: Options = {}) {
  const mergedOptions = defaults(options, { deep: false, priority: 1 });
  const updateFolderPromise = useRef<Promise<void>>();
  const [update, triggerUpdate] = useState<string>(uuid.v4());
  const triggerUpdateThrottled = useThrottledCallback(() => triggerUpdate(uuid.v4()), 2000);
  useFileEventListener('all', triggerUpdateThrottled, selectedFolder);

  useEffect(() => {
    function updateFoldersRecursively(entry: FileEntryModel): Promise<void> {
      return Promise.resolve()
        .then(() => entry.children || entry.loadChildren({ priority: mergedOptions.priority }))
        .then((children) => {
          if (mergedOptions.deep) {
            return Promise.map(values(children), (child) =>
              child.isFolder ? updateFoldersRecursively(child) : Promise.resolve()
            );
          }

          return null;
        })
        .then(() => {});
    }

    if (selectedFolder) {
      updateFolderPromise.current = updateFoldersRecursively(selectedFolder);
    }

    return () => updateFolderPromise.current?.cancel();
  }, [selectedFolder, update]);

  return update;
}
