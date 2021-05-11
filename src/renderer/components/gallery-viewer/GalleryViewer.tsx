import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';
import { useDispatch, useSelector } from 'react-redux';
import { max, throttle } from 'lodash';
import Promise from 'bluebird';
import ImageViewer from './ImageViewer';
import GalleryScroller from './GalleryScroller';
import { SELECTED_FOLDER_UPDATE_DEBOUNCE, selectSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import useDebounce from '../../hooks/useDebounce';
import { FileEntryModel, findFolderAndIndex } from '../../models/FileEntry';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';
import {
  selectGalleryScrollerHeight,
  selectGallerySort,
  setHeight,
  setSort,
} from '../../redux/slices/galleryScrollerSlice';
import useDragging from '../../hooks/useDragging';
import { THUMBNAIL_PADDING } from './Thumbnail';
import FileSystemService from '../../utils/FileSystemService';
import useFileEventListener from '../../hooks/useFileEventListener';

const useStyles = createUseStyles({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
    background: 'linear-gradient(45deg, rgb(35, 35, 35) 10%, rgb(26, 26, 26))',
  },
  galleryContainer: {
    background: 'rgba(0,0,0,.3)',
    whiteSpace: 'nowrap',
  },
  sortContainer: {
    position: 'absolute',
    top: -15,
    left: 15,
    background: 'rgba(40,40,40,.9)',
    width: 'max-content',
    height: 'max-content',
    border: '1px solid #555',
    zIndex: 1,
    borderRadius: 15,
    padding: '5px 10px',
  },
  sort: {
    background: 'transparent',
    appearance: 'none',
    color: '#ccc',
    border: 0,
    cursor: 'pointer',
  },
  dragHandle: {
    width: '100%',
    height: 1,
    background: '#555',
    zIndex: 1,
    position: 'absolute',
    top: 0,
    '&:after': {
      content: '""',
      height: 9,
      width: '100%',
      position: 'absolute',
      top: 0,
      bottom: 0,
      marginTop: -4,
      backgroundColor: 'transparent',
      cursor: 'ns-resize',
      zIndex: 2,
    },
  },
});

export default function GalleryViewer(): JSX.Element {
  const classes = useStyles();
  const rootFolder = useSelector(selectRootFolder);
  const container = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<HTMLDivElement>(null);
  const selectedFolderPath = useDebounce(useSelector(selectSelectedFolder), SELECTED_FOLDER_UPDATE_DEBOUNCE);
  const height = useSelector(selectGalleryScrollerHeight);
  const sort = useSelector(selectGallerySort);
  const updateFolderPromise = useRef<Promise<void>>();
  const [, triggerUpdate] = useState<void>();
  const dispatch = useDispatch();

  const selectedFolder = useMemo(() => {
    const { folder, index } = findFolderAndIndex(rootFolder, selectedFolderPath) as {
      folder: FileEntryModel;
      index: number;
    };

    if (folder) {
      if (folder.children !== null && index !== null) {
        return folder.children[index];
      }

      return folder;
    }

    return null;
  }, [selectedFolderPath, rootFolder]);

  const triggerUpdateThrottled = useMemo(() => throttle(() => triggerUpdate(), 2000), [triggerUpdate]);
  useFileEventListener('all', triggerUpdateThrottled, selectedFolder);

  useEffect(() => {
    function getAndUpdateFolder(entry: FileEntryModel): Promise<FileEntryModel[]> {
      if (!entry.children) {
        return FileSystemService.getChildren(entry.fullPath, { priority: 1 })
          .then((children) => children && entry.addChildren(children))
          .then(() => entry.children || []);
      }

      return Promise.resolve([]);
    }

    function updateFoldersRecursively(entry: FileEntryModel): Promise<void> {
      return Promise.resolve()
        .then(() => entry.children || getAndUpdateFolder(entry))
        .then((children) =>
          Promise.all(children.map((child) => (child.isFolder ? updateFoldersRecursively(child) : Promise.resolve())))
        )
        .then(() => {});
    }

    if (selectedFolder) {
      updateFolderPromise.current = updateFoldersRecursively(selectedFolder);
    }

    return () => updateFolderPromise.current?.cancel();
  }, [selectedFolder]);

  useDragging(
    dragHandle,
    ({ y }) => {
      if (!container.current) {
        return;
      }

      const newHeight = max([0, height - y]) || 0;
      container.current.style.height = `${newHeight}px`;
    },
    () => {},
    ({ y }) => {
      const newHeight = max([0, height - y]) || 0;
      dispatch(setHeight(Math.round(newHeight - THUMBNAIL_PADDING * 2)));
    }
  );

  const onSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSort(event.target.value));
  };

  return (
    <div className={classes.container}>
      <div className={classes.imageContainer}>
        <ImageViewer />
      </div>
      <div ref={container} className={classes.galleryContainer} style={{ height }}>
        <div className={classes.dragHandle} ref={dragHandle} />
        <div className={classes.sortContainer}>
          <select value={sort} onChange={onSortChange} className={classes.sort}>
            <option value="fullPath:asc">Filename &#11014;</option>
            <option value="fullPath:desc">Filename &#11015;</option>
          </select>
        </div>
        <AutoSizer disableHeight style={{ width: '100%' }}>
          {({ width }) => (
            <GalleryScroller key={selectedFolderPath} folder={selectedFolder} width={width} height={height} />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
