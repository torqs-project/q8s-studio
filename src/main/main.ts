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
import fs from 'fs';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

let mainWindow: BrowserWindow | null = null;
const allChildProcessess: number[] = [];
const configFileDirName = 'user-configurations/'; // directory name for user configuration files

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

/* ---------------------------------------
  Local file handling
 ----------------------------------------*/

/**
 * Write a file to the user's appData directory. Converts the JS object to a JSON string.
 * @param fileName The name of the file to write
 * @param content The content to write to the file as an JS object
 * @returns Boolean value to indicate if writing was successful
 */
async function writeFile(fileName: string, content: object) {
  let filePath;
  try {
    filePath = path.join(app.getPath('userData'), configFileDirName, fileName);
    const contentJSON = JSON.stringify(content);
    fs.writeFileSync(filePath, contentJSON); // Throws an error
    await dialog.showMessageBox(mainWindow!, {
      message: 'File saved successfully',
    });

    return true;
  } catch (error) {
    dialog.showMessageBox(mainWindow!, {
      message: `Error saving file. \n Error message:\n${error}`,
    });
    return false;
  }
}

/**
 * Delete a file from the user's appData directory.
 * @async Waits for the file to be deleted and waits for the dialog to be closed
 * @param {string} fileName The name of the file to delete
 * @return A Boolean value which indicates if the file was deleted successfully
 */
async function deleteFile(fileName: string) {
  let filePath;
  try {
    filePath = path.join(app.getPath('userData'), configFileDirName, fileName);
    fs.rmSync(filePath);
    await dialog.showMessageBox(mainWindow!, {
      message: 'File deleted successfully',
    });

    return true;
  } catch (error) {
    dialog.showMessageBox(mainWindow!, {
      message: `Error deleting file. \n Error message:\n${error}`,
    });
    return false;
  }
}

/**
 * Loads files from the appData directory and returns their contents as an array of objects.
 *
 * @async Show error message
 * @returns {Promise<object[]>}
 */
async function loadFiles(): Promise<object[]> {
  const folderPath = path.join(app.getPath('userData'), configFileDirName);
  console.log(folderPath);
  const fileContents: object[] = [];
  try {
    const filesToReturn = fs.readdirSync(folderPath);
    filesToReturn.forEach((file) => {
      console.log(`file ${file}`);
      try {
        fileContents.push(
          JSON.parse(fs.readFileSync(folderPath + file, 'utf8')),
        );
      } catch (error) {
        dialog.showErrorBox(
          'Error',
          `Error loading file ${file}. \n Error message:\n${error}`,
        );
        console.log(error);
      }
    });
    console.log(fileContents);
  } catch (error) {
    dialog.showErrorBox(
      'error',
      `Error loading files. \n Error message:\n${error}`,
    );
    console.log(error);
  }

  return fileContents;
}

/**
 * Opens a system file explorer to open a file or directory and returns the selected file or directory.
 *
 * @async
 * @param {WebContents} sender not used
 * @param {boolean} isDirectory Specifies if the file explorer should open a directory or a file.
 * @returns {unknown} Returns the path of the selected file or of the directory
 */
async function handleFileOpen(sender: WebContents, isDirectory: boolean) {
  let fileOrDir: 'openFile' | 'openDirectory' = 'openFile';
  if (isDirectory) {
    fileOrDir = 'openDirectory';
  }
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: [fileOrDir],
  });
  if (!canceled) {
    return filePaths[0];
  }
  return '';
}

function killAllProcessess(processes: number[]) {
  processes.forEach((childPID: number) => {
    process.kill(childPID);
  });
}

/* ---------------------------------------
  IPC handlers
 ----------------------------------------*/
ipcMain.handle('writeFile', (_event, fileName, content) =>
  writeFile(fileName, content),
);
ipcMain.handle('deleteFile', (_event, fileName) => deleteFile(fileName));
ipcMain.handle('loadFiles', () => {
  return loadFiles();
});
ipcMain.handle('openFile', (event, arg) => {
  return handleFileOpen(event.sender, arg);
});
ipcMain.handle('killProcess', () => {
  killAllProcessess(allChildProcessess);
  return 'All child processes killed';
});
ipcMain.handle('runCommand', (_event, givenCommand) => {
  // Split command to list of arguments
  const splitted = givenCommand.split(' ');
  // Get the command
  const cmd = splitted[0];
  // Get the arguments
  const cmdArgs = splitted.slice(1);
  let dockerProcess: ChildProcess;
  // Ask for sudo password if on linux
  if (process.platform === 'linux') {
    let command = ['-S']; // Use -S to ask the sudo password and show it in the output
    command = command.concat(splitted);
    dockerProcess = require('child_process').spawn('sudo', command);
  } else {
    dockerProcess = require('child_process').spawn(cmd, cmdArgs);
  }
  if (dockerProcess.pid) {
    allChildProcessess.push(dockerProcess.pid); // Add child process to list of all child processes for killing when exiting app
  }
  // Handle stdios
  // For some reason output from docker goes to stderr instead of stdout.
  dockerProcess.stdout?.on('data', (data: Buffer) => {
    mainWindow?.webContents.send(
      'cli-output',
      `OUTPUT DATA CP: ${data.toString()}`,
    );
    return `${data.toString()}data`;
  });
  dockerProcess.stderr?.on('data', (err: Buffer) => {
    if (err.toString().includes('password')) {
      // Send message to renderer to include a password input
      mainWindow?.webContents.send('ask-pass', true);
      // Pass the returning password from renderer to the child process
      ipcMain.on('pass', (_event2, pwd = '') => {
        dockerProcess.stdin?.write(`${pwd}\n`);
        dockerProcess.stdin?.end();
      });
    }
    // Parse and handle URL
    if (err.toString().includes('URL')) {
      const stringAsWords = err.toString().split(' ');
      stringAsWords.forEach((possibleURL) => {
        let checkedURL;
        try {
          checkedURL = new URL(possibleURL);
          if (checkedURL.hostname.includes('127.0.0.1')) {
            mainWindow?.webContents.send('lab-url', checkedURL.toString());
            // Use this code to open in the same window as the application:
            // mainWindow?.webContents.loadURL(checkedURL.toString());
          }
        } catch (error) {
          // console.log('No Valid URL found');
        }
      });
      mainWindow?.webContents.send('cli-output', `URL: ${err.toString()}`);
    } else {
      mainWindow?.webContents.send('cli-output', `${err.toString()}`);
    }
    return `${err.toString()}err`;
  });
  dockerProcess.on('exit', (code: Buffer) => {
    mainWindow?.webContents.send(
      'cli-output',
      `EXIT CODE CP: ${code.toString()}`,
    );
    if (dockerProcess.pid) {
      const remIndex = allChildProcessess.indexOf(dockerProcess.pid);
      if (remIndex > -1) {
        allChildProcessess.splice(remIndex, 1); // Remove child process from list of all child processes
      }
    }
  });
});

/* ---------------------------------------
  Code from Electron Boilerplate
 ----------------------------------------*/
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
      mainWindow.maximize();
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

app.on('window-all-closed', () => {
  killAllProcessess(allChildProcessess);
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
    mainWindow?.maximize();
    // Create an user-configurations folder in the users appData directory if it doesn't exist yet
    // See https://www.electronjs.org/docs/latest/api/app#appgetpathname
    const folderPath = path.join(app.getPath('userData'), configFileDirName);
    try {
      fs.readdirSync(folderPath); // Throws an error if the folder doesn't exist
    } catch {
      // Create the folder
      try {
        fs.mkdirSync(folderPath);
      } catch (error) {
        dialog.showErrorBox('Error', `Failed to create folder: ${error}`);
        console.log(error);
      }
    }
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
