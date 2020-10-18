import React, { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import Promise from 'bluebird';
import { useDispatch, useSelector } from 'react-redux';
import DirectoryViewer from '../features/directory-viewer/DirectoryViewer';
import GalleryViewer from '../features/gallery-viewer/GalleryViewer';
import FileEntry from '../utils/FileEntry';
import {
  selectRootFolderPath,
  setRootFolder,
  setRootFolderPath,
  setCachePath,
  selectRootFolder,
  updateFile,
  removeFile,
} from '../features/rootFolderSlice';
import { setSelectedFolder } from '../features/selectedFolderSlice';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    height: 'calc(100% - 35px)',
    margin: '0 1px 1px 1px',
    position: 'relative',
  },
});

export default function Home(): JSX.Element {
  const styles = useStyles();
  const rootFolderPath = useSelector(selectRootFolderPath);
  const rootFolder = useSelector(selectRootFolder);
  const [rootFolderPathCache, setRootFolderPathCache] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    function handleFolderChanged(_: Electron.IpcRendererEvent, newPath: string) {
      dispatch(setRootFolderPath(newPath));
    }
    function handleFileChanged(_: Electron.IpcRendererEvent, entry: FileEntry) {
      dispatch(updateFile(entry));
    }
    function handleFileRemoved(_: Electron.IpcRendererEvent, path: string) {
      dispatch(removeFile(path));
    }

    ipcRenderer.on('current-folder-changed', handleFolderChanged);
    ipcRenderer.on('file-changed', handleFileChanged);
    ipcRenderer.on('file-removed', handleFileRemoved);

    return () => {
      ipcRenderer.removeListener('current-folder-changed', handleFolderChanged);
      ipcRenderer.removeListener('file-changed', handleFileChanged);
      ipcRenderer.removeListener('file-removed', handleFileRemoved);
    };
  }, []);

  useEffect(() => {
    if (rootFolderPathCache === rootFolderPath && rootFolder !== null) {
      return () => {};
    }

    setRootFolderPathCache(rootFolderPath);

    const promise = Promise.resolve()
      .then(() => ipcRenderer.invoke('get-file-tree', rootFolderPath))
      .tap((folder: FileEntry) => dispatch(setRootFolder(folder)))
      .tap((folder: FileEntry) => dispatch(setSelectedFolder(folder)))
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

  return (
    <div className={styles.container}>
      <DirectoryViewer />
      <GalleryViewer />
    </div>
  );
}
