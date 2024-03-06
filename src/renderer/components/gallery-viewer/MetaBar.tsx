import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, EllipsisHorizontalIcon, Squares2X2Icon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { Fragment, memo, useRef } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';

import useEventListener from 'renderer/hooks/useEventListener';
import {
  type SortBy,
  type SortDirection,
  State,
  selectFilesCount,
  selectGallerySortBy,
  selectGallerySortDirection,
  selectGalleryViewer,
  setSortBy,
  setSortDirection,
  setViewer,
  sortByValues,
} from 'renderer/redux/slices/galleryViewerSlice';
import { setSelectedIndex } from 'renderer/redux/slices/selectedFolderSlice';
import { useIsFileSystemServiceWorking } from 'renderer/utils/FileSystemService';

const useStyles = createUseStyles({
  metaBar: {
    height: '3rem',
    background: 'rgba(40,40,40,.9)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#ccc',
    borderStyle: 'solid',
    borderColor: '#555',
    borderWidth: '1px 0 1px 0',
    zIndex: 1,
  },
  leftSide: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    height: '100%',
    display: 'flex',
    width: '60%',
    maxWidth: '800px',
    gap: '1rem',
    alignItems: 'center',
  },
  rightSide: {
    height: '100%',
  },
  inputWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: '2rem',
    background: '#333',
    borderRadius: '6px',
    borderStyle: 'solid',
    borderColor: '#555',
    borderWidth: '0 1px 0 1px',
  },
  inputElement: {
    background: 'transparent',
    border: 'none',
    flex: '1',
  },
  sort: {
    height: '1.5rem',
    width: '10%',
    minWidth: '100px',
    background: '#292929',
    padding: '0 8px',
    appearance: 'none',
    color: '#ccc',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    borderLeft: '1px solid #555',
    borderTopRightRadius: '6px',
    borderBottomRightRadius: '6px',
    textAlign: 'center',
    '& option': {
      fontSize: '16px',
      lineHeight: '25px',
    },
  },
  viewer: {
    display: 'flex',
    height: '1.5rem',
    alignItems: 'center',
    '& > i': {
      boxSizing: 'border-box',
      padding: '2px 5px',
      borderStyle: 'solid',
      borderColor: '#555',
      borderWidth: '0 1px 0 0',
      cursor: 'pointer',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      '&.selected': {
        background: 'rgba(255,255,255,.15)',
      },
      '&:hover': {
        background: 'rgba(255,255,255,.3)',
      },
    },
  },
  icon: {
    fontSize: '20px',
  },
  count: {
    fontSize: '10px',
  },
});

const sortByNames: Record<SortBy, string> = {
  fullPath: 'Filename',
  accessedTime: 'Accessed',
  modifiedTime: 'Modified',
  createdTime: 'Created',
} as const;

export default memo(function MetaBar({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  const filesCount = useSelector(selectFilesCount);
  const selectedSortBy = useSelector(selectGallerySortBy);
  const selectedSortDirection = useSelector(selectGallerySortDirection);
  const viewer = useSelector(selectGalleryViewer);
  const isFileSystemServiceWorking = useIsFileSystemServiceWorking();
  const dispatch = useDispatch();
  const classes = useStyles();
  const inputRef = useRef<HTMLInputElement>(null);

  const onSortByChange = (newSortBy: SortBy) => {
    dispatch(setSortBy(newSortBy));
  };

  const onSortDirectionChange = (newSortDirection: SortDirection) => {
    dispatch(setSortDirection(newSortDirection));
  };

  const onViewerSelect = (nextViewer: State['viewer']) => {
    dispatch(setViewer(nextViewer));
    dispatch(setSelectedIndex(nextViewer === 'line' ? 0 : null));
  };

  useEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key === ' ' && document.activeElement === inputRef.current) {
        event.stopPropagation();
        return;
      }

      if (
        ![
          'Shift',
          'Ctrl',
          'Alt',
          'Cmd',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Enter',
          'Esc',
          ' ',
        ].includes(event.key)
      ) {
        inputRef.current?.focus();
        return;
      }

      inputRef.current?.blur();
    },
    undefined,
    true,
    { capture: true },
  );

  const unselectedViewer = viewer === 'line' ? 'grid' : 'line';

  return (
    <div className={classes.metaBar}>
      <div className={classes.leftSide} />
      <div className={classes.center}>
        <input
          ref={inputRef}
          type="text"
          className="block w-full rounded-lg border border-zinc-600 bg-transparent p-1.5 text-sm text-gray-400"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <Menu as="div" className="display-inline relative text-left">
          <div className="flex h-full items-center">
            <Menu.Button className="group inline-flex items-center justify-center text-base font-medium text-zinc-400 hover:text-zinc-300">
              Sort
              <ChevronDownIcon
                className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-zinc-400 group-hover:text-zinc-300"
                aria-hidden="true"
              />
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 w-40 origin-top-right divide-y divide-zinc-600 overflow-hidden rounded-md bg-zinc-800 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {sortByValues.map((sortBy) => (
                  <Menu.Item
                    key={sortBy}
                    as="button"
                    onClick={() => onSortByChange(sortBy)}
                    className={classNames(
                      'block w-full px-4 py-2 text-left text-base hover:bg-zinc-700',
                      sortBy === selectedSortBy ? 'bg-zinc-600' : '',
                    )}
                  >
                    {sortByNames[sortBy]}
                  </Menu.Item>
                ))}
              </div>
              <div className="py-1">
                <Menu.Item
                  as="button"
                  onClick={() => onSortDirectionChange('asc')}
                  className={classNames(
                    'block w-full px-4 py-2 text-left text-base hover:bg-zinc-700',
                    selectedSortDirection === 'asc' ? 'bg-zinc-600' : '',
                  )}
                >
                  Ascending
                </Menu.Item>
                <Menu.Item
                  as="button"
                  onClick={() => onSortDirectionChange('desc')}
                  className={classNames(
                    'block w-full px-4 py-2 text-left text-base hover:bg-zinc-700',
                    selectedSortDirection === 'desc' ? 'bg-zinc-600' : '',
                  )}
                >
                  Descending
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
        <button
          type="button"
          aria-label="Change view"
          onClick={() => onViewerSelect(unselectedViewer)}
          className="block h-8 text-base text-zinc-400 hover:text-zinc-300"
        >
          <ViewerIcon viewer={viewer} />
        </button>
      </div>
      <div className={classNames('flex w-14 items-center justify-end', classes.rightSide)}>
        {isFileSystemServiceWorking && (
          <div role="status">
            <svg
              aria-hidden="true"
              className="me-2 h-3 w-3 animate-spin fill-zinc-400 text-gray-200 dark:text-gray-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        )}
        <div className={classNames('me-2', classes.count)}>{filesCount}</div>
      </div>
    </div>
  );
});

function ViewerIcon({ viewer }: { viewer: State['viewer'] }) {
  switch (viewer) {
    case 'grid':
      return <Squares2X2Icon className="inline h-5 w-8" />;
    case 'line':
      return <EllipsisHorizontalIcon className="inline h-8 w-8" />;
    default:
      return null;
  }
}
