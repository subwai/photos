import { map } from 'lodash';
import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';
import { FileEntryModel } from '../../models/FileEntry';
import { selectSelectedFolder } from '../../redux/slices/selectedFolderSlice';
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
  const selectedFolderPath = useSelector(selectSelectedFolder);
  const classes = useStyles();

  return (
    <div className={classes.folderList}>
      {map(visibleFolders, (folder) => (
        <Folder
          key={folder.fullPath}
          fileEntry={folder}
          isSelected={folder.fullPath === selectedFolderPath}
          onClick={onSelectFolder}
        />
      ))}
    </div>
  );
});
