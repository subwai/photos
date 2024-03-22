import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';

// eslint-disable-next-line import/no-cycle
import { FileImageViewer } from 'renderer/components/gallery-viewer/ImageViewer';
import PeekGridScroller from 'renderer/components/gallery-viewer/peek-grid-viewer/PeekGridScroller';
import PeekMetaBar from 'renderer/components/gallery-viewer/peek-grid-viewer/PeekMetaBar';
import { FileEntryModel } from 'renderer/models/FileEntry';

const useStyles = createUseStyles({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
});

type Props = {
  fileEntry: FileEntryModel;
};

export default function PeekGridViewer({ fileEntry }: Props) {
  const classes = useStyles();
  const [selectedFile, setSelectedFile] = useState<FileEntryModel | null>(null);
  const [selectedFolder, setSelectedFolder] = useState(fileEntry);
  const [peek, setPeek] = useState(false);

  if (!fileEntry) {
    return null;
  }

  return (
    <>
      <div className={classes.container}>
        <PeekMetaBar fileEntry={fileEntry} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} />
        <AutoSizer>
          {({ width, height }) => (
            <PeekGridScroller
              width={width}
              height={height}
              fileEntry={fileEntry}
              setSelectedFile={setSelectedFile}
              selectedFolder={selectedFolder}
              setSelectedFolder={setSelectedFolder}
              peek={peek}
              setPeek={setPeek}
            />
          )}
        </AutoSizer>
      </div>
      {selectedFile !== null && peek && (
        <FileImageViewer fileEntry={selectedFile} setPeek={setPeek} previewType="file" />
      )}
    </>
  );
}
