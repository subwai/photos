import { ArrowUpIcon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { memo } from 'react';
import { createUseStyles } from 'react-jss';

import type { FileEntryModel } from 'renderer/models/FileEntry';

const useStyles = createUseStyles({
  metaBar: {
    height: '2rem',
    background: 'rgba(30,30,30,.7)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#ccc',
  },
});

export default memo(function PeekMetaBar({
  fileEntry,
  selectedFolder,
  setSelectedFolder,
}: {
  fileEntry: FileEntryModel;
  selectedFolder: FileEntryModel;
  setSelectedFolder: (value: FileEntryModel) => void;
}) {
  const classes = useStyles();

  return (
    <div className={classes.metaBar}>
      <div className="flex h-full items-center justify-center pl-2">
        <button
          type="button"
          aria-label="Go up one level"
          onClick={() => selectedFolder?.parent && setSelectedFolder(selectedFolder.parent)}
          className="block h-8 text-base text-zinc-400 hover:text-zinc-300 disabled:text-zinc-600"
          disabled={!selectedFolder?.parent || selectedFolder === fileEntry}
        >
          <ArrowUpIcon className="inline h-5 w-8" />
        </button>
      </div>
      <div className="max-w[800px] flex h-full w-[60%] items-center gap-[1rem]" />
      <div className={classNames('flex h-full w-14 items-center justify-end')} />
    </div>
  );
});
