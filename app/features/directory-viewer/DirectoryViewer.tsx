import React, { useRef, useState } from 'react';
import { createUseStyles } from 'react-jss';

import _ from 'lodash';
import FileEntry from '../../utils/FileEntry';
import Folder from './Folder';
import useEventListener from '../../utils/useEventListener';

const useStyles = createUseStyles({
  container: {
    overflow: 'scroll',
    userSelect: 'none',
    background: 'rgba(0,0,0,.2)',
  },
  dragHandle: {
    position: 'absolute',
    height: '100%',
    width: 1,
    background: '#333',
    zIndex: 1,
    '&:after': {
      content: '""',
      width: 9,
      position: 'absolute',
      top: 0,
      bottom: 0,
      marginLeft: -4,
      backgroundColor: 'transparent',
      cursor: 'ew-resize',
      zIndex: 2,
    },
  },
});

interface Props {
  fileEntry: FileEntry | null;
  selectedFolder: FileEntry | null;
  onSelect: (arg0: FileEntry) => void;
  autoSelectLast: boolean;
}

export default function DirectoryViewer({ fileEntry, selectedFolder, autoSelectLast, onSelect }: Props): JSX.Element {
  const styles = useStyles();
  const [width, setWidth] = useState<number>(250);
  const [dragStart, setDragging] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const dragHandle = useRef<HTMLDivElement>(null);

  const startDragging = (event: React.MouseEvent) => {
    event.preventDefault();
    setDragging(event.pageX);
  };

  useEventListener(
    'pointermove',
    (event: MouseEvent) => {
      event.preventDefault();
      if (container.current === null || dragHandle.current === null || dragStart === null) {
        return;
      }

      const newWidth = _.max([0, width + event.pageX - dragStart]) || 0;
      container.current.style.width = `${newWidth}px`;
      dragHandle.current.style.left = `${newWidth}px`;
    },
    window,
    dragStart !== null
  );

  useEventListener(
    'pointerup',
    (event: MouseEvent) => {
      event.preventDefault();
      if (dragStart === null) {
        return;
      }

      const newWidth = _.max([0, width + event.pageX - dragStart]) || 0;
      setDragging(null);
      setWidth(newWidth);
    },
    window,
    dragStart !== null
  );

  return (
    <div ref={container} className={styles.container} style={{ width }}>
      <div
        ref={dragHandle}
        className={styles.dragHandle}
        role="separator"
        onMouseDown={startDragging}
        style={{ left: width }}
      />
      {fileEntry && <Folder {...{ fileEntry, selectedFolder, autoSelectLast, onSelect }} />}
    </div>
  );
}
