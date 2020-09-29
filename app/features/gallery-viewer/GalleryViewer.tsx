import React, { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';
import FileEntry from '../../utils/FileEntry';
import ImageViewer from './ImageViewer';
import GalleryScroller from './GalleryScroller';

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

interface Props {
  selectedFolder: FileEntry | null;
  cachePath: string | null;
}

export default function GalleryViewer({ selectedFolder, cachePath }: Props): JSX.Element {
  const styles = useStyles();
  const [selected, setSelected] = useState<FileEntry | null>(null);

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        <ImageViewer fileEntry={selected} />
      </div>
      <div>
        <AutoSizer disableHeight style={{ width: '100%' }}>
          {({ width }) => (
            <GalleryScroller
              key={selectedFolder ? selectedFolder.fullPath : undefined}
              folder={selectedFolder}
              cachePath={cachePath}
              onSelect={setSelected}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
