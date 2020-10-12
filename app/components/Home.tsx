import React, { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import Promise from 'bluebird';
import { useDispatch, useSelector } from 'react-redux';
import DirectoryViewer from '../features/directory-viewer/DirectoryViewer';
import GalleryViewer from '../features/gallery-viewer/GalleryViewer';
import FileEntry from '../utils/FileEntry';
import { selectRootFolderPath, setRootFolder, setRootFolderPath, setCachePath } from '../features/rootFolderSlice';
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
  const [rootFolderPathCache, setRootFolderPathCache] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    function handleFolderChanged(_: Electron.IpcRendererEvent, newPath: string) {
      dispatch(setRootFolderPath(newPath));
    }

    ipcRenderer.on('current-folder-changed', handleFolderChanged);

    return () => {
      ipcRenderer.removeListener('current-folder-changed', handleFolderChanged);
    };
  }, []);

  useEffect(() => {
    if (rootFolderPathCache === rootFolderPath) {
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
