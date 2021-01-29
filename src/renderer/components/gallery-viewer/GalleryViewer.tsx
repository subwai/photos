import React, { useMemo } from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';
import { useSelector } from 'react-redux';
import ImageViewer from './ImageViewer';
import GalleryScroller from './GalleryScroller';
import { selectSelectedFolder } from '../../redux/slices/selectedFolderSlice';
import useDebounce from '../../hooks/useDebounce';
import { findFolderAndIndex } from '../../models/FileEntry';
import { selectRootFolder } from '../../redux/slices/rootFolderSlice';

const useStyles = createUseStyles({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    overflow: 'hidden',
    background: 'linear-gradient(45deg, rgb(35, 35, 35) 10%, rgb(26, 26, 26))',
  },
});

export default function GalleryViewer(): JSX.Element {
  const classes = useStyles();
  const rootFolder = useSelector(selectRootFolder);
  const selectedFolderPath = useDebounce(useSelector(selectSelectedFolder), 250);
  const selectedFolder = useMemo(() => {
    const { folder, index } = findFolderAndIndex(rootFolder, selectedFolderPath);

    if (folder) {
      if (folder.children !== null && index !== null) {
        return folder.children[index];
      }

      return folder;
    }

    return null;
  }, [selectedFolderPath, rootFolder]);

  return (
    <div className={classes.container}>
      <div className={classes.imageContainer}>
        <ImageViewer />
      </div>
      <div>
        <AutoSizer disableHeight style={{ width: '100%' }}>
          {({ width }) => <GalleryScroller key={selectedFolderPath} folder={selectedFolder} width={width - 12} />}
        </AutoSizer>
      </div>
    </div>
  );
}
