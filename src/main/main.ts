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
import { ChildProcess, exec, execSync, spawn, spawnSync } from 'child_process';
import fs from 'fs';
import portscanner from 'portscanner';
import { electron, stdin } from 'process';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

let mainWindow: BrowserWindow | null = null;
const allChildProcessess: number[] = [];
const configFileDirName = 'user-configurations/'; // directory name for user configuration files
let containerName = '';
let containerPort = '8888';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

function formatCommand(
  commandToformat: string,
  askPass = false,
): [string, string[]] {
  const { platform } = process;
  // Split command to list of arguments
  const splitted = commandToformat.split(' ');
  // Get the command
  const cmd = splitted[0];
  // Get the arguments
  const cmdArgs = splitted.slice(1);
  // eslint-disable-next-line prefer-destructuring
  containerName = splitted[4];
  if (platform === 'linux') {
    let command: string[] = [];
    if (askPass) command = ['-S']; // Use -S to ask the sudo password and show it in the output
    command = command.concat(splitted);
    return ['sudo', command];
  }
  return [cmd, cmdArgs];
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
  exec('sudo docker kill runme');
  processes.forEach((childPID: number) => {
    process.kill(childPID, 'SIGKILL');
  });
  // For some reason above doesn't stop the docker process on windows, so run docker command to stop the container
  if (process.platform === 'win32' && containerName)
    spawn('docker', ['stop', containerName]);
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
ipcMain.handle('getPort', () =>
  portscanner
    .findAPortNotInUse(8888, 9999, '127.0.0.1')
    .then((port) => {
      containerPort = port.toString();
      return port;
    })
    .catch((err) => console.log(err)),
);
ipcMain.handle('runCommand', async (_event, givenCommand) => {
  const command = formatCommand(givenCommand, true);
  console.log(command);
  const dockerProcess = spawn(command[0], command[1]);
  if (dockerProcess.pid) {
    allChildProcessess.push(dockerProcess.pid); // Add child process to list of all child processes for killing when exiting app
  }

  dockerProcess.stdin.on('close', () => {
    console.log(dockerProcess.stdin.closed);
    console.log('stdin closed');
    // Check if image exists and send this information to renderer
    // The command returns the repository names of images as a string.
    const checkImageCommand = `docker images --format "{{.Repository}}"`;
    const formatted = formatCommand(checkImageCommand);
    console.log(formatted);
    const toRun = formatted[0].concat(` ${checkImageCommand}`);
    console.log(toRun);
    exec(toRun, (err, stdout, stderr) => {
      console.log(err?.message);
      console.log(stdout);
      console.log(stderr);
      const dataAsString = stdout;
      if (dataAsString.includes('torqs-project/q8s-devenv')) {
        console.log('ICLUDES THE IMAGE');
        mainWindow?.webContents.send('image-exists', true);
        console.log(`container name: ${containerName}`);
        let urlPropsJSON = '';
        // Execute a command that gets the parameters of the jupyter lab instance
        exec(
          `sudo docker exec ${containerName} jupyter lab list --json`,
          (errT, out, sterr) => {
            console.log(errT);
            console.log(sterr);
            try {
              console.log(`out: ${out}`);
              urlPropsJSON = JSON.parse(out.toString());
              console.log(urlPropsJSON);
              const url = `localhost:${urlPropsJSON.port}/lab?token=${urlPropsJSON.token}`;
              console.log(url);
              mainWindow?.webContents.send('lab-url', url);
            } catch (error) {
              console.log(error);
            }
          },
        );

      } else {
        console.log('DOES NOT INCLUDE THE IMAGE');
        mainWindow?.webContents.send('image-exists', false);
      }
    });
    // dockerProcess.stdout.on('data', (data: Buffer) => console.log("hel1"));
    // dockerProcess.stderr.on('data', (data: Buffer) => console.log("helo2"));
    // cp.stderr.on('data', (err: Buffer) => console.log(err.toString()));
    // dockerProcess.stderr.on('data', (data: Buffer) => {
    //   console.log('data');
    //   console.log(data.toString());
    //   const dataAsString = data.toString();
    //   if (dataAsString.includes('torqs-project/q8s-devenv')) {
    //     console.log('ICLUDES THE IMAGE');
    //     // mainWindow?.webContents.send('image-exists', true);
    //     // Execute a command that gets the parameters of the jupyter lab instance
    //     // exec(
    //     //   `sudo docker exec ${containerName} jupyter lab list --json`,
    //     //   (errT, out, sterr) => {
    //     //     try {
    //     //       const urlPropsJSON = JSON.parse(out.toString());
    //     //       console.log(urlPropsJSON);
    //     //     } catch (error) {
    //     //       console.log(error);
    //     //     }
    //     //   },
    //     // );

    //     // const url = `localhost:${portFromJSON}/lab?token=${tokenFromJSON}`;
    //   } else {
    //     console.log('DOES NOT INCLUDE THE IMAGE');
    //     mainWindow?.webContents.send('image-exists', false);
    //   }
    // });
  });
  // After password has been entered, run another command
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
        // eslint-disable-next-line prefer-destructuring
        containerName = givenCommand.split(' ')[4];
        dockerProcess.stdin.end();
      });
    } else {
      // eslint-disable-next-line prefer-destructuring
      containerName = givenCommand.split(' ')[4];
      dockerProcess.stdin.end();
    }
    // Parse and handle URL
    // if (err.toString().includes('URL')) {
    //   const stringAsWords = err.toString().split(' ');
    //   stringAsWords.forEach((possibleURL) => {
    //     let checkedURL;
    //     // If possibleURL is a valid URL, send it to the renderer, otherwise throws an error and does nothing
    //     try {
    //       checkedURL = new URL(possibleURL);
    //       if (checkedURL.hostname.includes('127.0.0.1')) {
    //         checkedURL.port = containerPort;
    //         mainWindow?.webContents.send('lab-url', checkedURL.toString());
    //         // Use this code to open in the same window as the application:
    //         // mainWindow?.webContents.loadURL(checkedURL.toString());
    //       }
    //     } catch (error) {
    //       // console.log('No Valid URL found');
    //     }
    //   });
    //   mainWindow?.webContents.send('cli-output', `URL: ${err.toString()}`);
    // } else {
    //   mainWindow?.webContents.send('cli-output', `${err.toString()}`);
    // }
    // dockerProcess.stdin?.end();
    mainWindow?.webContents.send('cli-output', `${err.toString()}`);
    return `${err.toString()}err`;
  });
  dockerProcess.on('exit', (code) => {
    mainWindow?.webContents.send('cli-output', `EXIT CODE CP: ${code}`);
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
