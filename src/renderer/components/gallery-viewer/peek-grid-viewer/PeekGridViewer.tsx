import { useState } from 'react';
import { createUseStyles } from 'react-jss';
import { AutoSizer } from 'react-virtualized';

// eslint-disable-next-line import/no-cycle
import { FileImageViewer } from 'renderer/components/gallery-viewer/ImageViewer';
import PeekGridScroller from 'renderer/components/gallery-viewer/peek-grid-viewer/PeekGridScroller';
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
  const [peek, setPeek] = useState(false);

  return (
    <>
      <div className={classes.container}>
        <AutoSizer>
          {({ width, height }) => (
            <PeekGridScroller
              width={width}
              height={height}
              fileEntry={fileEntry}
              setSelectedFile={setSelectedFile}
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
