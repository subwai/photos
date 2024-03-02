import Promise from 'bluebird';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { v4 as uuid4 } from 'uuid';

import useFileEventListener from 'renderer/hooks/useFileEventListener';
import useFileRerenderListener from 'renderer/hooks/useFileRerenderListener';
import { FileEntryModel } from 'renderer/models/FileEntry';

export default function useAutomaticCoverLoader(fileEntry: FileEntryModel | null) {
  const getCoverPromise = useRef<Promise<unknown>>();
  const [update, triggerUpdate] = useState<string>(uuid4());
  const [rerender, triggerRerender] = useState<string>(uuid4());
  const triggerUpdateThrottled = useDebouncedCallback(() => triggerUpdate(uuid4()), 5000);

  useFileEventListener('all', triggerUpdateThrottled, fileEntry);
  useFileRerenderListener(() => triggerRerender(uuid4()), fileEntry);

  useEffect(() => {
    if (fileEntry && !fileEntry.cover && !fileEntry.didLoadCover) {
      getCoverPromise.current = fileEntry.refreshCover();
    }

    return () => getCoverPromise.current?.cancel();
  }, [update, fileEntry?.cover]);

  return rerender;
}
