/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { BrowserWindow, BrowserWindowConstructorOptions, app, shell } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import 'utils/configure-bluebird';

import FileSystem, { getCachePath } from 'main/file-system';
import 'main/general';
import MenuBuilder from 'main/menu';
import 'main/thumbnails';
import { resolveHtmlPath } from 'main/util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let fileSystem: FileSystem | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

if (!existsSync(getCachePath())) {
  mkdirSync(getCachePath());
}

app.commandLine.appendArgument('--enable-features=Metal');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
app.commandLine.appendSwitch('trace-warnings');
app.commandLine.appendSwitch('disable-color-correct-rendering');

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      { loadExtensionOptions: { allowFileAccess: true }, forceDownload },
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  const getWindowOptions = (): BrowserWindowConstructorOptions => {
    return {
      show: false,
      width: 1024,
      height: 728,
      icon: getAssetPath('icon.png'),
      transparent: !isWindows,
      backgroundColor: !isWindows ? '#00000000' : '#000000',
      titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
      frame: false,
      vibrancy: 'under-window',
      visualEffectState: 'active',
      resizable: true,
      webPreferences: {
        sandbox: false,
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
        webSecurity: !isDevelopment,
      },
    };
  };

  mainWindow = new BrowserWindow(getWindowOptions());

  if (isWindows) {
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  fileSystem = new FileSystem(mainWindow);
  fileSystem.start();

  const menuBuilder = new MenuBuilder(mainWindow, fileSystem);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  mainWindow.on('swipe', (_event, cmd) => {
    // Navigate the window back when the user hits their mouse back button
    if (cmd === 'right' && mainWindow?.webContents.canGoBack()) {
      mainWindow.webContents.goBack();
    }
    if (cmd === 'left' && mainWindow?.webContents.canGoForward()) {
      mainWindow.webContents.goForward();
    }
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  const thumbsCachePath = path.join(getCachePath(), 'thumbs');
  if (!existsSync(thumbsCachePath)) {
    console.log('creating thumbnail cache', thumbsCachePath);
    mkdirSync(thumbsCachePath, { recursive: true });
  } else {
    console.log('thumbnail cache exists', thumbsCachePath);
  }
});

app.on('quit', () => {
  fileSystem?.closeWatcher();
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
