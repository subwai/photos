import React from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import { selectSelectedFile } from '../redux/slices/selectedFolderSlice';

const useStyles = createUseStyles({
  topBar: {
    minHeight: 34,
    display: 'flex',
    justifyContent: 'space-between',
  },
  fileName: {
    margin: 0,
    padding: 4,
    textAlign: 'center',
    textOverflow: 'ellipsis',
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
    flexWrap: 'no-wrap',
  },
  button: {
    background: 'transparent',
    color: '#eee',
    fontSize: 17,
    padding: '7px 15px',
    margin: 0,
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(255, 255, 255, .3)',
    },
  },
  close: {
    '&:hover': {
      background: 'rgba(255, 0, 0, .3)',
    },
  },
});

export default function TopBar() {
  const classes = useStyles();
  const selectedFile = useSelector(selectSelectedFile);

  function maximizeWindow(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    e.preventDefault();
    e.stopPropagation();

    ipcRenderer.invoke('maximize').catch(console.error);
  }

  function minimizeWindow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    e.stopPropagation();

    ipcRenderer.invoke('minimize').catch(console.error);
  }

  function closeWindow(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    e.stopPropagation();

    ipcRenderer.invoke('close').catch(console.error);
  }

  const isWindows = true;

  return (
    <div className={classes.topBar}>
      <div className={classes.dragArea} onDoubleClick={maximizeWindow}>
        <h5 className={classes.fileName}>{selectedFile?.name}</h5>
      </div>
      {isWindows && (
        <div className={classes.actionButtons}>
          <button type="button" className={classes.button} onClick={minimizeWindow}>
            <i className="far fa-window-minimize" />
          </button>
          <button type="button" className={classes.button} onClick={maximizeWindow}>
            <i className="far fa-window-maximize" />
          </button>
          <button type="button" className={classNames(classes.button, classes.close)} onClick={closeWindow}>
            <i className="fas fa-times" />
          </button>
        </div>
      )}
    </div>
  );
}
