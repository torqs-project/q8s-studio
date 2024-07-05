/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  WebContents,
} from 'electron';

import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { ChildProcess } from 'child_process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

async function handleFileOpen(sender: WebContents, isDirectory: boolean) {
  let fileOrDir: 'openFile' | 'openDirectory' = 'openFile';
  if (isDirectory) {
    fileOrDir = 'openDirectory';
  }
  console.log(isDirectory);
  console.log(fileOrDir);
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: [fileOrDir],
  });
  if (!canceled) {
    return filePaths[0];
  }
  return [];
}

ipcMain.handle('openFile', (event, arg) => {
  return handleFileOpen(event.sender, arg);
});

ipcMain.handle('runCommand', (_event, arg) => {
  // Split command to list of arguments
  const splitted = arg.split(' ');
  // Get the command
  const cmd = splitted[0];
  // Get the arguments
  const cmdArgs = splitted.slice(1);
  let bat: ChildProcess;
  if (process.platform === 'linux') {
    let command = ['-S'];
    command = command.concat(splitted);
    console.log(`AFTER CONCAT ${command}`);
    bat = require('child_process').spawn('sudo', command);
  } else {
    bat = require('child_process').spawn(cmd, cmdArgs);
  }
  // Handle stdios
  bat.stdout?.on('data', (data: Buffer) => {
    // console.log(data.toString());
    mainWindow?.webContents.send(
      'cli-output',
      `OUTPUT DATA CP: ${data.toString()}`,
    );
    // ipcRenderer.send('str', `${data.toString()}data`);
    return `${data.toString()}data`;
  });
  bat.stderr?.on('data', (err: Buffer) => {
    // if err has "password in the string, use ask pass"
    console.log(err.toString().includes('password'));
    console.log(err.toString().includes('password'));
    if (err.toString().includes('password')) {
      // console.log('tultiin ask-pass llähetykseen');
      // Send message to renderer to include a password input
      mainWindow?.webContents.send('ask-pass', true);
      // Handle the returning password from renderer
      ipcMain.on('pass', (_event2, pwd = '') => {
        bat.stdin?.write(`${pwd}\n`);
      });
    }
    if (err.toString().includes('URL')) {
      console.log(`Löytyi URLl alskjklfajdfl: ${err.toString()}`);
      mainWindow?.webContents.send('cli-output', `Wait for the URL...`);
      mainWindow?.webContents.send('cli-output', `${err.toString()}`);
    } else {
      mainWindow?.webContents.send('cli-output', `${err.toString()}`);
    }

    return `${err.toString()}err`;
  });
  bat.on('exit', (code: Buffer) => {
    // console.log(code.toString());
    mainWindow?.webContents.send(
      'cli-output',
      `EXIT CODE CP: ${code.toString()}`,
    );
    return `${code.toString()}exit`;
  });
});
// ipcMain.on('ipc-example', (event, arg: string[]) => {
//   // Split command to list of arguments
//   const splitted = arg[0].split(' ');
//   // Get the command
//   const cmd = splitted[0];
//   // Get the arguments
//   const cmdArgs = splitted.slice(1);
//   let bat;
//   if (process.platform === 'linux') {
//     bat = require('child_process').spawn('sudo', splitted);
//   } else {
//     bat = require('child_process').spawn(cmd, cmdArgs);
//   }
//   // Handle stdios
//   bat.stdout.on('data', (data: Buffer) => {
//     console.log(data.toString());
//     event.reply('ipc-example', `${data.toString()}data`);
//   });
//   bat.stderr.on('data', (err) => {
//     console.log(err.toString());
//     event.reply('ipc-example', `${err.toString()}err`);
//   });
//   bat.on('exit', (code) => {
//     event.reply('ipc-example', `${code.toString()}exit`);
//     console.log(code.toString());
//   });
// });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

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

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
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
