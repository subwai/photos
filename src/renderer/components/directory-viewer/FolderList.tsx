import { memo } from 'react';
import { createUseStyles } from 'react-jss';
import { List, ListRowRenderer } from 'react-virtualized';

import Folder from 'renderer/components/directory-viewer/Folder';
import useSelectedFolder from 'renderer/hooks/useSelectedFolder';
import type { FileEntryModel } from 'renderer/models/FileEntry';

interface Props {
  width: number;
  height: number;
  visibleFolders: FileEntryModel[];
  onSelectFolder: (entry: FileEntryModel) => void;
}

const useStyles = createUseStyles({
  folderList: {
    flex: 1,
  },
});

export default memo(function FolderList({ width, height, visibleFolders, onSelectFolder }: Props): JSX.Element {
  const [selectedFolder] = useSelectedFolder();
  const classes = useStyles();

  const rowRenderer: ListRowRenderer = ({ index, style }) => {
    const folder = visibleFolders[index];
    return (
      <Folder
        key={folder.fullPath}
        fileEntry={folder}
        isSelected={folder === selectedFolder}
        onClick={onSelectFolder}
        style={style}
      />
    );
  };

  return (
    <div className={classes.folderList}>
      <List
        width={width}
        height={height}
        rowHeight={40}
        rowCount={visibleFolders.length}
        rowRenderer={rowRenderer}
        overscanRowCount={10}
      />
    </div>
  );
});
