import React from 'react';
import { createUseStyles } from 'react-jss';
import { ipcRenderer } from 'electron';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
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
    fontSize: 17,
    padding: '5px 17px',
    margin: 0,
    cursor: 'pointer',
    transition: 'background 300ms',
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
        <span className={classes.fileName}>{selectedFile?.name}</span>
      </div>
      {isWindows && (
        <div className={classes.actionButtons}>
          <button type="button" className={classes.button} onClick={minimizeWindow}>
            <svg
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className={classNames('fa-window-minimize', classes.icon, classes.minimizeIcon)}
            >
              <path
                fill="currentColor"
                d="M640 247.5v17a16 16 0 0 1-16 16H16a16 16 0 0 1-16-16v-17a16 16 0 0 1 16-16h608a16 16 0 0 1 16 16z"
              />
            </svg>
          </button>
          <button type="button" className={classes.button} onClick={maximizeWindow}>
            <svg
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className={classNames('fa-window-maximize', classes.icon, classes.maximizeIcon)}
            >
              <path fill="currentColor" d="M0 0v512h512V0H0zm464 464H48V48h416v416z" />
            </svg>
          </button>
          <button type="button" className={classNames(classes.button, classes.close)} onClick={closeWindow}>
            <svg
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 333 512"
              className={classNames('fa-window-close', classes.icon, classes.closeIcon)}
            >
              <path
                fill="currentColor"
                d="M193.94 256L296.5 153.44l21.15-21.15c3.12-3.12 3.12-8.19 0-11.31l-22.63-22.63c-3.12-3.12-8.19-3.12-11.31 0L160 222.06 36.29 98.34c-3.12-3.12-8.19-3.12-11.31 0L2.34 120.97c-3.12 3.12-3.12 8.19 0 11.31L126.06 256 2.34 379.71c-3.12 3.12-3.12 8.19 0 11.31l22.63 22.63c3.12 3.12 8.19 3.12 11.31 0L160 289.94 262.56 392.5l21.15 21.15c3.12 3.12 8.19 3.12 11.31 0l22.63-22.63c3.12-3.12 3.12-8.19 0-11.31L193.94 256z"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
