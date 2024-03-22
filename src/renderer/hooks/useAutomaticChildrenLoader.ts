import BluebirdPromise from 'bluebird';
import { defaults, values } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { v4 as uuid4 } from 'uuid';

import useFileEventListener from 'renderer/hooks/useFileEventListener';
import useFileRerenderListener from 'renderer/hooks/useFileRerenderListener';
import type { FileEntryModel } from 'renderer/models/FileEntry';

type Options = {
  deep?: boolean;
  priority?: number;
};

export default function useAutomaticChildrenLoader(selectedFolder: FileEntryModel | null, options: Options = {}) {
  const mergedOptions = defaults(options, { deep: false, priority: 1 });
  const updateFolderPromise = useRef<BluebirdPromise<void>>();
  const [update, triggerUpdate] = useState<string>(uuid4());
  const [rerender, triggerRerender] = useState<string>(uuid4());
  const triggerUpdateThrottled = useDebouncedCallback(() => triggerUpdate(uuid4()), 5000);

  useFileRerenderListener(() => triggerRerender(uuid4()), selectedFolder);

  useFileEventListener(
    'all',
    ({ target }: { target: FileEntryModel }) => {
      if (target.fullPath === selectedFolder?.fullPath) {
        triggerUpdate(uuid4());
      } else {
        triggerUpdateThrottled();
      }
    },
    selectedFolder,
  );

  useEffect(() => {
    function updateFoldersRecursively(entry: FileEntryModel): BluebirdPromise<void> {
      return BluebirdPromise.resolve()
        .then(() =>
          !entry.didLoadChildren ? entry.refreshChildren({ priority: mergedOptions.priority }) : entry.children,
        )
        .then((children) => {
          if (mergedOptions.deep) {
            return BluebirdPromise.map(values(children), (child) =>
              child.isFolder ? updateFoldersRecursively(child) : BluebirdPromise.resolve(),
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

  return rerender;
}
