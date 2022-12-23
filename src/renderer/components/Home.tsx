import Promise from 'bluebird';
import { values } from 'lodash';
import path from 'path';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import type { Listener, Update } from 'history';
import useSelectedFolder from '../hooks/useSelectedFolder';
import useSelectedIndex from '../hooks/useSelectedIndex';
import FileEntryObject, { FileEntryModel } from '../models/FileEntry';
import {
  removeFile,
  selectRootFolder,
  selectRootFolderPath,
  setCachePath,
  setRootFolder,
  setRootFolderPath,
  updateFile,
} from '../redux/slices/rootFolderSlice';
import DirectoryViewer from './directory-viewer/DirectoryViewer';
import GalleryViewer from './gallery-viewer/GalleryViewer';
import { history } from '../redux/store';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    height: 'calc(100% - 35px)',
    margin: '0 1px 1px 1px',
    position: 'relative',
  },
});

export default function Home() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [, setSelectedFolder] = useSelectedFolder();
  const [selectedIndex, setSelectedIndex] = useSelectedIndex();
  const rootFolderPath = useSelector(selectRootFolderPath);
  const rootFolder = useSelector(selectRootFolder);
  const [rootFolderPathCache, setRootFolderPathCache] = useState<string | null>(null);

  useEffect(() => {
    function handleFolderChanged(newPath: string) {
      dispatch(setRootFolderPath(newPath));
    }
    function handleFileChanged(args: { eventType: string; entry: FileEntryObject }) {
      dispatch(updateFile(args));
    }
    function handleFileRemoved(fullPath: string) {
      dispatch(removeFile(fullPath));
    }

    window.electron.on('current-folder-changed', handleFolderChanged);
    window.electron.on('file-changed', handleFileChanged);
    window.electron.on('file-removed', handleFileRemoved);

    return () => {
      window.electron.removeListener('current-folder-changed', handleFolderChanged);
      window.electron.removeListener('file-changed', handleFileChanged);
      window.electron.removeListener('file-removed', handleFileRemoved);
    };
  }, [dispatch]);

  useEffect(() => {
    if (rootFolderPathCache === rootFolderPath && rootFolder !== null) {
      return () => {};
    }

    setRootFolderPathCache(rootFolderPath);

    const root = rootFolderPath
      ? new FileEntryModel({
          name: path.basename(rootFolderPath),
          fullPath: rootFolderPath,
          isFolder: true,
          children: null,
          level: 0,
          createdTime: new Date(),
          accessedTime: new Date(),
          modifiedTime: new Date(),
        })
      : null;

    dispatch(setRootFolder(root));
    setSelectedFolder(root);

    const promise = Promise.resolve()
      .then(() => root?.loadChildren({ priority: 2 }))
      .then((children) =>
        Promise.map(values(children || {}), (child: FileEntryModel) => child.loadChildren({ priority: 2 }))
      )
      .catch(console.error);

    return () => promise.cancel();
  }, [rootFolderPath]);

  useEffect(() => {
    const promise = Promise.resolve()
      .then(() => window.electron.invoke('get-cache-path'))
      .then((cachePath) => dispatch(setCachePath(cachePath)))
      .catch(console.error);

    return () => promise.cancel();
  }, []);

  const callback = ({ location }: Update) => {
    if (location.hash === '') {
      return;
    }

    const [index] = location.hash.replace('#', '').split('_').map(Number);
    if (index !== selectedIndex && !Number.isNaN(index)) {
      setSelectedIndex(index);
    }
  };

  const callbackRef = useRef<Listener>(callback);
  callbackRef.current = callback;

  useLayoutEffect(() => {
    history.listen((update) => callbackRef.current(update));
  }, [history]);

  return (
    <div className={classes.container}>
      <DirectoryViewer />
      <GalleryViewer />
    </div>
  );
}
