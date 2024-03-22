import Promise from 'bluebird';
import { values } from 'lodash';
import path from 'path';
import { useEffect, useState } from 'react';
import { createUseStyles } from 'react-jss';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import DirectoryViewer from 'renderer/components/directory-viewer/DirectoryViewer';
import GalleryViewer from 'renderer/components/gallery-viewer/GalleryViewer';
import useEventListener from 'renderer/hooks/useEventListener';
import useSelectedFolder from 'renderer/hooks/useSelectedFolder';
import FileEntryObject, { FileEntryModel } from 'renderer/models/FileEntry';
import {
  removeFile,
  selectRootFolder,
  selectRootFolderPath,
  setCachePath,
  setRootFolder,
  setRootFolderPath,
  updateFile,
} from 'renderer/redux/slices/rootFolderSlice';

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
  const rootFolderPath = useSelector(selectRootFolderPath);
  const rootFolder = useSelector(selectRootFolder);
  const [rootFolderPathCache, setRootFolderPathCache] = useState<string | null>(null);
  const navigate = useNavigate();

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
  }, [rootFolderPath]);

  useEffect(() => {
    const promise = Promise.resolve()
      .then(() => window.electron.invoke('get-cache-path'))
      .then((cachePath) => dispatch(setCachePath(cachePath)))
      .catch(console.error);

    return () => promise.cancel();
  }, []);

  useEventListener('keydown', (event: React.KeyboardEvent) => {
    switch (true) {
      case event.key === 'R' && event.ctrlKey:
        event.preventDefault();
        console.log('reload', rootFolder);
        rootFolder?.triggerEvent('update');
        break;
      default:
        break;
    }
  });

  useEventListener('mousedown', (event: React.MouseEvent) => {
    switch (event.button) {
      case 3:
        navigate(-1);
        break;
      case 4:
        navigate(1);
        break;
      default:
        break;
    }
  });

  return (
    <div className={classes.container}>
      <DirectoryViewer />
      <GalleryViewer />
    </div>
  );
}
