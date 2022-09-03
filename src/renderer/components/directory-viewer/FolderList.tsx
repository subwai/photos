import { map } from 'lodash';
import { memo } from 'react';
import { createUseStyles } from 'react-jss';
import useSelectedFolder from '../../hooks/useSelectedFolder';
import type { FileEntryModel } from '../../models/FileEntry';
import Folder from './Folder';

interface FolderListProps {
  visibleFolders: FileEntryModel[];
  onSelectFolder: (entry: FileEntryModel) => void;
}

const useStyles = createUseStyles({
  folderList: {
    flex: 1,
  },
});

export default memo(function FolderList({ visibleFolders, onSelectFolder }: FolderListProps): JSX.Element {
  const [selectedFolder] = useSelectedFolder();
  const classes = useStyles();

  return (
    <div className={classes.folderList}>
      {map(visibleFolders, (folder) => (
        <Folder
          key={folder.fullPath}
          fileEntry={folder}
          isSelected={folder === selectedFolder}
          onClick={onSelectFolder}
        />
      ))}
    </div>
  );
});
