import BluebirdPromise from 'bluebird';
import { defaults, values } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuid4 } from 'uuid';

import useFileRerenderListener from 'renderer/hooks/useFileRerenderListener';
import type { FileEntryModel } from 'renderer/models/FileEntry';

type Options = {
  deep?: boolean;
  priority?: number;
};

export default function useAutomaticChildrenLoader(selectedFolder: FileEntryModel | null, options: Options = {}) {
  const mergedOptions = defaults(options, { deep: false, priority: 1 });
  const updateFolderPromise = useRef<BluebirdPromise<void>>();
  const [rerender, triggerRerender] = useState<string>(uuid4());

  useFileRerenderListener(() => triggerRerender(uuid4()), selectedFolder);

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
  }, [selectedFolder]);

  return rerender;
}
