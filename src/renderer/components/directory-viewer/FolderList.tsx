import { memo } from 'react';
import { Grid, type GridCellRenderer, accessibilityOverscanIndicesGetter } from 'react-virtualized';

import Folder from 'renderer/components/directory-viewer/Folder';
import type { ExtendedGrid } from 'renderer/components/gallery-viewer/grid-viewer/GridScroller';
import useSelectedFolder from 'renderer/hooks/useSelectedFolder';
import type { FileEntryModel } from 'renderer/models/FileEntry';

interface Props {
  width: number;
  height: number;
  visibleFolders: FileEntryModel[];
  onSelectFolder: (entry: FileEntryModel) => void;
  gridRef?: React.Ref<ExtendedGrid> | null;
}

export default memo(function FolderList({
  width,
  height,
  visibleFolders,
  onSelectFolder,
  gridRef,
}: Props): JSX.Element {
  const [selectedFolder] = useSelectedFolder();

  const rowRenderer: GridCellRenderer = ({ rowIndex, style }) => {
    const folder = visibleFolders[rowIndex];
    const widthDescriptor = Object.getOwnPropertyDescriptor(style, 'width');
    if (widthDescriptor && widthDescriptor.writable) {
      style.width = '100%';
    }

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
    <Grid
      ref={gridRef}
      autoContainerWidth
      width={width}
      height={height}
      rowHeight={40}
      rowCount={visibleFolders.length}
      columnWidth={width}
      columnCount={1}
      cellRenderer={rowRenderer}
      overscanRowCount={10}
      overscanIndicesGetter={accessibilityOverscanIndicesGetter}
    />
  );
});
