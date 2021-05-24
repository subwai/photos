import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { FileEntryModel } from '../models/FileEntry';
import { selectRootFolder } from '../redux/slices/rootFolderSlice';

export default function useSelectedFolder(): [FileEntryModel | null, (folder: FileEntryModel | null) => void] {
  const history = useHistory();
  const location = useLocation();
  const root = useSelector(selectRootFolder);

  const setSelectedFolder = useCallback(
    (folder: FileEntryModel | null) => {
      const nextPath = encodeURIComponent(folder ? folder.fullPath : '');
      if (`/${decodeURI(nextPath)}` !== location.pathname) {
        history.push(nextPath);
      }
    },
    [history, location]
  );

  return [root?.find(decodeURIComponent(location.pathname).substr(1)) || null, setSelectedFolder];
}
