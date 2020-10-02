import React from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';
import { useSelector } from 'react-redux';
import ImageViewer from './ImageViewer';
import GalleryScroller from './GalleryScroller';
import { selectSelectedFolder } from '../selectedFolderSlice';

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
  const styles = useStyles();
  const selectedFolder = useSelector(selectSelectedFolder);

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        <ImageViewer />
      </div>
      <div>
        <AutoSizer disableHeight style={{ width: '100%' }}>
          {({ width }) => (
            <GalleryScroller
              key={selectedFolder ? selectedFolder.fullPath : undefined}
              folder={selectedFolder}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
