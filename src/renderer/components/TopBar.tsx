import React from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import { useSelector } from 'react-redux';
import { selectSelectedFile } from '../redux/slices/selectedFolderSlice';

const useStyles = createUseStyles({
  topBar: {
    minHeight: 34,
    '-webkitAppRegion': 'drag',
    display: 'flex',
    justifyContent: 'center',
  },
  fileName: {
    margin: 0,
    padding: '4px 200px',
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
  },
});

export default function TopBar() {
  const classes = useStyles();
  const selectedFile = useSelector(selectSelectedFile);

  function maximizeWindow() {
    ipcRenderer.invoke('maximize').catch(console.error);
  }

  return (
    <div className={classes.topBar} onDoubleClick={maximizeWindow}>
      <h5 className={classes.fileName}>{selectedFile?.name}</h5>
    </div>
  );
}
