import classNames from 'classnames';
import { createUseStyles } from 'react-jss';
import { useSelector } from 'react-redux';

import { selectSelectedFile } from 'renderer/redux/slices/selectedFolderSlice';

const useStyles = createUseStyles({
  topBar: {
    height: 30,
    display: 'flex',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,.05)',
  },
  folderPath: {
    margin: 0,
    overflow: 'hidden',
    textAlign: 'center',
    textWrap: 'nowrap',
    textOverflow: 'ellipsis',
    fontSize: 14,
    display: 'block',
  },
  fileName: {
    margin: 0,
    overflow: 'hidden',
    textAlign: 'center',
    textWrap: 'nowrap',
    textOverflow: 'ellipsis',
    fontSize: 14,
    display: 'block',
    // direction: 'rtl',
  },
  dragArea: {
    flex: 1,
    display: '-webkit-box',
    '-webkitAppRegion': 'drag',
    '-webkitBoxOrient': 'vertical',
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
    window.electron.invoke('maximize').catch(console.error);
  }

  function minimizeWindow() {
    window.electron.invoke('minimize').catch(console.error);
  }

  function closeWindow() {
    window.electron.invoke('close').catch(console.error);
  }

  const isMac = window.electron.platform === 'darwin';

  const folderPath = selectedFile ? selectedFile.parent?.fullPath : '';
  const pathDeliminator = isMac ? '/' : '\\';

  return (
    <div className={classes.topBar}>
      <div className={classes.dragArea} onDoubleClick={maximizeWindow} title={selectedFile?.fullPath}>
        <div className="flex h-full w-full ">
          <div className="flex h-full w-[80%] items-center justify-center">
            <span className={classes.folderPath}>{folderPath}</span>
            <span className={classes.fileName}>
              {selectedFile?.name ? pathDeliminator : ''}
              {selectedFile?.name}
            </span>
          </div>
        </div>
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
