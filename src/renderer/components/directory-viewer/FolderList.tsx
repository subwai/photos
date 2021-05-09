import React, { memo } from 'react';
import { useSelector } from 'react-redux';
import { map } from 'lodash';
import { selectSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import FileEntry from '../../models/FileEntry';
import Folder from './Folder';

interface FolderListProps {
  visibleFolders: FileEntry[];
  rootFolder: FileEntry | null;
  onSelectIndex: (index: number) => void;
}

const FolderList = memo(function FolderList({
  visibleFolders,
  rootFolder,
  onSelectIndex,
}: FolderListProps): JSX.Element {
  const selectedFolderPath = useSelector(selectSelectedFolder);

  return (
    <>
      {map(visibleFolders, (folder, index: number) => (
        <Folder
          key={folder.fullPath}
          index={index}
          fileEntry={folder}
          isRoot={folder === rootFolder}
          isSelected={folder.fullPath === selectedFolderPath}
          onClick={onSelectIndex}
        />
      ))}
    </>
  );
});

export default FolderList;
