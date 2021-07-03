import Promise from 'bluebird';
import { ipcRenderer } from 'electron';
import { Action, Location, LocationListener, LocationState } from 'history';
import { values } from 'lodash';
import path from 'path';
import React, { useEffect, useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
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

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    height: 'calc(100% - 35px)',
    margin: '0 1px 1px 1px',
    position: 'relative',
  },
});

export default function Home(): JSX.Element {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const [, setSelectedFolder] = useSelectedFolder();
  const [selectedIndex, setSelectedIndex] = useSelectedIndex();
  const rootFolderPath = useSelector(selectRootFolderPath);
  const rootFolder = useSelector(selectRootFolder);
  const [rootFolderPathCache, setRootFolderPathCache] = useState<string | null>(null);

  useEffect(() => {
    function handleFolderChanged(_: Electron.IpcRendererEvent, newPath: string) {
      dispatch(setRootFolderPath(newPath));
    }
    function handleFileChanged(_: Electron.IpcRendererEvent, args: { eventType: string; entry: FileEntryObject }) {
      dispatch(updateFile(args));
    }
    function handleFileRemoved(_: Electron.IpcRendererEvent, fullPath: string) {
      dispatch(removeFile(fullPath));
    }

    ipcRenderer.on('current-folder-changed', handleFolderChanged);
    ipcRenderer.on('file-changed', handleFileChanged);
    ipcRenderer.on('file-removed', handleFileRemoved);

    return () => {
      ipcRenderer.removeListener('current-folder-changed', handleFolderChanged);
      ipcRenderer.removeListener('file-changed', handleFileChanged);
      ipcRenderer.removeListener('file-removed', handleFileRemoved);
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
        })
      : null;

    dispatch(setRootFolder(root));
    setSelectedFolder(root);

    const promise = Promise.resolve()
      .then(() => root?.loadChildren({ priority: 2 }))
      .then((children) => Promise.map(values(children || {}), (child) => child.loadChildren({ priority: 2 })))
      .catch(console.error);

    return () => promise.cancel();
  }, [rootFolderPath]);

  useEffect(() => {
    const promise = Promise.resolve()
      .then(() => ipcRenderer.invoke('get-cache-path'))
      .then((cachePath) => dispatch(setCachePath(cachePath)))
      .catch(console.error);

    return () => promise.cancel();
  }, []);

  const callback = (location: Location<LocationState>) => {
    if (location.hash === '') {
      return;
    }

    const [index] = location.hash.replace('#', '').split('_').map(Number);
    if (index !== selectedIndex && !Number.isNaN(index)) {
      setSelectedIndex(index);
    }
  };

  const callbackRef = useRef<LocationListener<LocationState>>(callback);
  callbackRef.current = callback;

  useEffect(
    () => history.listen((location: Location<LocationState>, action: Action) => callbackRef.current(location, action)),
    []
  );

  return (
    <div className={classes.container}>
      <DirectoryViewer />
      <GalleryViewer />
    </div>
  );
}
