import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { FileEntryModel } from '../models/FileEntry';
import { selectRootFolder } from '../redux/slices/rootFolderSlice';

export default function useSelectedFolder(): [FileEntryModel | null, (folder: FileEntryModel | null) => void] {
  const history = useHistory();
  const root = useSelector(selectRootFolder);

  return [
    root?.find(decodeURIComponent(history.location.pathname).substr(1)) || null,
    (folder: FileEntryModel | null) => {
      history.push(encodeURIComponent(folder ? folder.fullPath : ''));
    },
  ];
}
