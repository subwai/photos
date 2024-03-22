import Promise from 'bluebird';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuid4 } from 'uuid';

import useFileRerenderListener from 'renderer/hooks/useFileRerenderListener';
import { FileEntryModel } from 'renderer/models/FileEntry';

export default function useAutomaticCoverLoader(fileEntry: FileEntryModel | null) {
  const getCoverPromise = useRef<Promise<unknown>>();
  const [rerender, triggerRerender] = useState<string>(uuid4());

  useFileRerenderListener(() => triggerRerender(uuid4()), fileEntry);

  useEffect(() => {
    if (fileEntry && !fileEntry.cover && !fileEntry.didLoadCover) {
      getCoverPromise.current = fileEntry.refreshCover();
    }

    return () => getCoverPromise.current?.cancel();
  }, [fileEntry?.cover]);

  return rerender;
}
