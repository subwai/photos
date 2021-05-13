import { map } from 'lodash';
import React, { memo } from 'react';
import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';
import { FileEntryModel } from '../../models/FileEntry';
import { selectSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import Folder from './Folder';

interface FolderListProps {
  visibleFolders: FileEntryModel[];
  onSelectIndex: (index: number) => void;
}

const useStyles = createUseStyles({
  folderList: {
    flex: 1,
  },
});

export default memo(function FolderList({ visibleFolders, onSelectIndex }: FolderListProps): JSX.Element {
  const selectedFolderPath = useSelector(selectSelectedFolder);
  const classes = useStyles();

  return (
    <div className={classes.folderList}>
      {map(visibleFolders, (folder, index: number) => (
        <Folder
          key={folder.fullPath}
          index={index}
          fileEntry={folder}
          isSelected={folder.fullPath === selectedFolderPath}
          onClick={onSelectIndex}
        />
      ))}
    </div>
  );
});
