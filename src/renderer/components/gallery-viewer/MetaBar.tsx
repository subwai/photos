import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, EllipsisHorizontalIcon, Squares2X2Icon } from '@heroicons/react/20/solid';
import classNames from 'classnames';
import { Fragment, memo, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';

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

export default memo(function MetaBar() {
  const filesCount = useSelector(selectFilesCount);
  const selectedSortBy = useSelector(selectGallerySortBy);
  const selectedSortDirection = useSelector(selectGallerySortDirection);
  const viewer = useSelector(selectGalleryViewer);
  const dispatch = useDispatch();
  const classes = useStyles();
  const [query, setQuery] = useState('');

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

  const unselectedViewer = viewer === 'line' ? 'grid' : 'line';

  return (
    <div className={classes.metaBar}>
      <div className={classes.leftSide} />
      <div className={classes.center}>
        <div className={classes.inputWrapper}>
          <input
            type="text"
            className={classes.inputElement}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
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
          className="block text-base hover:bg-zinc-700"
        >
          <ViewerIcon viewer={viewer} />
        </button>
      </div>
      <div className={classNames('flex w-14 items-center justify-end', classes.rightSide)}>
        <div className={classNames('px-2', classes.count)}>{filesCount}</div>
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
