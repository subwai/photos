import React, { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import Promise from 'bluebird';
import { useDispatch, useSelector } from 'react-redux';
import DirectoryViewer from '../features/directory-viewer/DirectoryViewer';
import GalleryViewer from '../features/gallery-viewer/GalleryViewer';
import FileEntry from '../utils/FileEntry';
import { selectCurrentFolder, setFolder } from '../features/gallery-viewer/currentFolderSlice';

const useStyles = createUseStyles({
  container: {
    display: 'flex',
    height: 'calc(100% - 34px)',
  },
});

export default function Home(): JSX.Element {
  const styles = useStyles();
  const [fileEntry, setFileEntry] = useState<FileEntry | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<FileEntry | null>(null);
  const [autoSelectLast, setAutoSelectLastFolder] = useState(false);
  const [cachePath, setCachePath] = useState<string | null>(null);
  const folderPath = useSelector(selectCurrentFolder);
  const dispatch = useDispatch();

  useEffect(() => {
    function handleFolderChanged(_: Electron.IpcRendererEvent, newPath: string) {
      dispatch(setFolder(newPath));
    }

    ipcRenderer.on('current-folder-changed', handleFolderChanged);

    return () => {
      ipcRenderer.removeListener('current-folder-changed', handleFolderChanged);
    };
  }, [dispatch]);

  useEffect(() => {
    const promise = Promise.resolve()
      .then(() => ipcRenderer.invoke('get-file-tree', folderPath))
      .tap(setFileEntry)
      .tap(setSelectedFolder)
      .catch(console.error);

    return () => promise.cancel();
  }, [folderPath]);

  useEffect(() => {
    const promise = Promise.resolve()
      .then(() => ipcRenderer.invoke('get-cache-path'))
      .then(setCachePath)
      .catch(console.error);

    return () => promise.cancel();
  }, []);

  const handleSelect = (folder: FileEntry, _autoSelectLast = false) => {
    setAutoSelectLastFolder(_autoSelectLast);
    setSelectedFolder(folder);
  };

  return (
    <div className={styles.container}>
      <DirectoryViewer {...{ fileEntry, selectedFolder, autoSelectLast }} onSelect={handleSelect} />
      <GalleryViewer {...{ fileEntry, selectedFolder, cachePath }} />
    </div>
  );
}
