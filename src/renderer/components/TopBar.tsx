import React from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import { useSelector } from 'react-redux';
import { selectSelectedFile } from '../redux/slices/selectedFolderSlice';

const useStyles = createUseStyles({
  topBar: {
    minHeight: 30,
    display: 'flex',
    justifyContent: 'space-between',
  },
  fileName: {
    margin: 0,
    padding: 4,
    textAlign: 'center',
    textOverflow: 'ellipsis',
    fontSize: 14,
    display: 'block',
  },
  dragArea: {
    flex: 1,
    display: '-webkit-box',
    '-webkitAppRegion': 'drag',
    '-webkitBoxOrient': 'vertical',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingTop: 5,
  },
  actionButtons: {
    display: 'flex',
    flexWrap: 'nowrap',
  },
  button: {
    background: 'transparent',
    color: '#eee',
    fontSize: 11,
    padding: '5px 17px',
    margin: 0,
    transition: 'background 200ms',
    fontFamily: 'Segoe MDL2 Assets',
    '&:hover': {
      background: 'rgba(255, 255, 255, .3)',
    },
  },
  icon: {
    verticalAlign: 'middle',
  },
  minimizeIcon: {
    height: 12,
  },
  maximizeIcon: {
    height: 12,
  },
  closeIcon: {
    height: 19.2,
  },
  close: {
    '&:hover': {
      background: 'rgba(255, 0, 0, .5)',
    },
  },
});

export default function TopBar(): JSX.Element | null {
  const classes = useStyles();
  const selectedFile = useSelector(selectSelectedFile);

  function maximizeWindow(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    e.preventDefault();
    e.stopPropagation();

    ipcRenderer.invoke('maximize').catch(console.error);
  }

  // function minimizeWindow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //
  //   ipcRenderer.invoke('minimize').catch(console.error);
  // }
  //
  // function closeWindow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
  //   e.preventDefault();
  //   e.stopPropagation();
  //
  //   ipcRenderer.invoke('close').catch(console.error);
  // }

  if (process.platform !== 'darwin') {
    return null;
  }

  // const isWindows = process.platform === 'win32';

  return (
    <div className={classes.topBar} onDoubleClick={maximizeWindow}>
      <div className={classes.dragArea}>
        <span className={classes.fileName}>{selectedFile?.name}</span>
      </div>
      {/* {isWindows && ( */}
      {/*  <div className={classes.actionButtons}> */}
      {/*    <button type="button" className={classes.button} onClick={minimizeWindow}> */}
      {/*      &#xE921; */}
      {/*    </button> */}
      {/*    <button type="button" className={classes.button} onClick={maximizeWindow}> */}
      {/*      &#xE922; */}
      {/*    </button> */}
      {/*    <button type="button" className={classNames(classes.button, classes.close)} onClick={closeWindow}> */}
      {/*      &#xE8BB; */}
      {/*    </button> */}
      {/*  </div> */}
      {/* )} */}
    </div>
  );
}
