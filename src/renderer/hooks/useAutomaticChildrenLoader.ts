import Promise from 'bluebird';
import { defaults, values } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { v4 as uuid4 } from 'uuid';
import { FileEntryModel } from '../models/FileEntry';
import useFileEventListener from './useFileEventListener';

type Options = {
  deep?: boolean;
  priority?: number;
};

export default function useAutomaticChildrenLoader(selectedFolder: FileEntryModel | null, options: Options = {}) {
  const mergedOptions = defaults(options, { deep: false, priority: 1 });
  const updateFolderPromise = useRef<Promise<void>>();
  const [update, triggerUpdate] = useState<string>(uuid4());
  const triggerUpdateThrottled = useDebouncedCallback(() => triggerUpdate(uuid4()), 2000);
  useFileEventListener('all', triggerUpdateThrottled, selectedFolder);

  useEffect(() => {
    function updateFoldersRecursively(entry: FileEntryModel): Promise<void> {
      console.log('update recursive', entry);
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
