import classNames from 'classnames';
import { ipcRenderer } from 'electron';
import React from 'react';
import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';
import { selectSelectedFile } from '../redux/slices/selectedFolderSlice';

const useStyles = createUseStyles({
  topBar: {
    minHeight: 30,
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,.05)',
  },
  fileName: {
    margin: 0,
    padding: '7px 4px 4px',
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
  },
  resizer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    '-webkitAppRegion': 'no-drag',
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

  function maximizeWindow() {
    ipcRenderer.invoke('maximize').catch(console.error);
  }

  function minimizeWindow() {
    ipcRenderer.invoke('minimize').catch(console.error);
  }

  function closeWindow() {
    ipcRenderer.invoke('close').catch(console.error);
  }

  const isMac = process.platform === 'darwin';

  return (
    <div className={classes.topBar}>
      <div className={classes.dragArea}>
        <span className={classes.fileName}>{selectedFile?.name}</span>
      </div>
      {!isMac && (
        <div className={classes.actionButtons}>
          <button type="button" className={classes.button} onClick={minimizeWindow}>
            &#xE921;
          </button>
          <button type="button" className={classes.button} onClick={maximizeWindow}>
            &#xE922;
          </button>
          <button type="button" className={classNames(classes.button, classes.close)} onClick={closeWindow}>
            &#xE8BB;
          </button>
        </div>
      )}
      <div className={classes.resizer} />
    </div>
  );
}
