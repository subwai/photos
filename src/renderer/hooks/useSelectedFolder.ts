import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { FileEntryModel } from '../models/FileEntry';
import { selectRootFolder } from '../redux/slices/rootFolderSlice';

export default function useSelectedFolder(): [FileEntryModel | null, (folder: FileEntryModel | null) => void] {
  const navigate = useNavigate();
  const location = useLocation();
  const root = useSelector(selectRootFolder);

  const setSelectedFolder = useCallback(
    (folder: FileEntryModel | null) => {
      const nextPath = encodeURIComponent(folder ? folder.fullPath : '');
      if (`/${decodeURI(nextPath)}` !== location.pathname) {
        navigate(`/${decodeURI(nextPath)}`);
      }
    },
    [location]
  );

  return [root?.find(decodeURIComponent(location.pathname).substring(1)) || null, setSelectedFolder];
}
