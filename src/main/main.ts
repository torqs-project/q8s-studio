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
import { exec, execSync, spawn } from 'child_process';
import fs from 'fs';
import portscanner from 'portscanner';
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

/**
 * Formats a command to be used in spawn function. If linux is used, adds sudo to the command.
 *
 * @param {string} commandToformat The command to format
 * @param {boolean} [askPass=false] If sudo password is needed, askPass should be true
 * @returns An object with the command, arguments, the whole command as a string the container name
 */
function formatCommand(
  commandToformat: string,
  askPass: boolean = false,
): {
  command: string;
  commandArgs: string[];
  commandAsString: string;
  containerName: string;
} {
  const { platform } = process;
  // Split command to list of arguments
  const splitted = commandToformat.split(' ');
  // Get the command
  const cmd = splitted[0];
  // Get the arguments
  const cmdArgs = splitted.slice(1);
  // eslint-disable-next-line prefer-destructuring
  const containerName = splitted[3];
  let resultObject = {
    command: cmd,
    commandArgs: cmdArgs,
    commandAsString: commandToformat,
    containerName,
  };
  if (platform === 'linux') {
    let command: string[] = [];
    if (askPass) command = ['-S']; // Use -S to ask the sudo password and show it in the output
    command = command.concat(splitted);
    const result: [string, string[], string] = ['sudo', command, containerName];
    const commandAsString = result[0]
      .concat(` ${result[1]}`)
      .replaceAll(',', ' ');
    console.log('Command as string:');
    console.log(commandAsString);
    resultObject = {
      command: result[0],
      commandArgs: result[1],
      commandAsString,
      containerName: result[2],
    };
    return resultObject;
  }
  return resultObject;
}

/**
 * Gets the URL of the container.
 *
 * @async
 * @param {string} containerName The name of the container.
 * @param {string} port The port of the container.
 */
async function getURL(containerName: string, port: string) {
  // Has more props, but these are used here
  let urlPropsJSON: { token: string } = {
    token: '',
  };
  // Execute a command that gets the parameters of the jupyter lab instance
  const dockerExecCmd = formatCommand(
    `docker exec ${containerName} jupyter lab list --json`,
  );
  const out = execSync(dockerExecCmd.commandAsString);
  try {
    urlPropsJSON = JSON.parse(out.toString());
    const url = `http://localhost:${port}/lab?token=${urlPropsJSON.token}`;
    console.log(url);
    return url;
  } catch (error) {
    console.log(error);
    return '';
  }
}

/**
 * Spawns a child process for the docker container and sends the output to the renderer
 * @param mainCommand Command to run
 * @param args Arguments for the command
 * @param containerName Name of the docker container
 * @param port The port where to run the container
 */
async function dockerRun(
  mainCommand: string,
  args: string[],
  containerName: string,
  port: string,
) {
  const dockerProcess = spawn(mainCommand, args);
  if (dockerProcess.pid) {
    allChildProcessess.push(dockerProcess.pid); // Add child process to list of all child processes for killing when exiting app
  }
  // Handle stdio
  // For some reason output from docker goes to stderr instead of stdout.
  dockerProcess.stderr?.on('data', async (msg: Buffer) => {
    mainWindow?.webContents.send('cli-output', `${msg.toString()}`);
    if (msg.toString().includes('To access the server')) {
      const url = await getURL(containerName, port);
      mainWindow?.webContents.send('lab-url', url);
      mainWindow?.webContents.send(
        'cli-output',
        `Environment running on: ${url}`,
      );
    }
    return `${msg.toString()}err`;
  });
  dockerProcess.on('exit', (code) => {
    mainWindow?.webContents.send('cli-output', `Exited with code: ${code}`);
    if (dockerProcess.pid) {
      const remIndex = allChildProcessess.indexOf(dockerProcess.pid);
      if (remIndex > -1) {
        allChildProcessess.splice(remIndex, 1); // Remove child process from list of all child processes
      }
    }
  });
}

function runCommand(givenCommand: string, port: string) {
  const givenCmdFormatted = formatCommand(givenCommand, true);
  const { command, commandArgs, containerName } = givenCmdFormatted;
  // Check if image of the container exists
  const checkImageCommand = `docker images --format "{{.Repository}}"`;
  const formatted = formatCommand(checkImageCommand);
  const checkImageToRun = formatted.commandAsString;
  exec(checkImageToRun, async (_err, stdout) => {
    const dataAsString = stdout;
    if (dataAsString.includes('torqs-project/q8s-devenv')) {
      console.log('ICLUDES THE IMAGE');
      mainWindow?.webContents.send('image-exists', true);
      // Check if container exists
      const checkFormatted = formatCommand(
        `docker container ls -a --format "{{.Names}}"`,
      );
      exec(checkFormatted.commandAsString, (_errContainer, containers) => {
        if (containers.includes(containerName)) {
          console.log('ICLUDES THE CONTAINER');
          // Check if the container is running
          const containersExec = formatCommand(
            `docker container ls --format "{{.Names}}"`,
          );
          exec(
            containersExec.commandAsString,
            async (errorMsg, runningContainers, stderrMsg) => {
              if (runningContainers.includes(containerName)) {
                console.log('IS RUNNING');
                console.log(errorMsg);
                console.log(stderrMsg);
                mainWindow?.webContents.send(
                  'cli-output',
                  `An environment already exists. Getting environment URL...`,
                );
                const url = await getURL(containerName, port);
                mainWindow?.webContents.send('lab-url', url);
                mainWindow?.webContents.send(
                  'cli-output',
                  `Environment running on: ${url}`,
                );
              } else {
                console.log('IS NOT RUNNING');
                // Remove the container before starting a new one, because the port might differ from the existing container's port
                exec(
                  formatCommand(`docker container rm ${containerName}`)
                    .commandAsString,
                );
                dockerRun(command, commandArgs, containerName, port);
              }
            },
          );
        } else {
          console.log('DOES NOT INCLUDE THE CONTAINER');
          dockerRun(command, commandArgs, containerName, port);
        }
      });
    } else {
      console.log('DOES NOT INCLUDE THE IMAGE');
      mainWindow?.webContents.send('image-exists', false); // Show 'stop download' button on the renderer
      dockerRun(command, commandArgs, containerName, port);
    }
  });
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
 * @returns {Promise<object[]>} The contents of of the files
 */
async function loadFiles(): Promise<object[]> {
  const folderPath = path.join(app.getPath('userData'), configFileDirName);
  const fileContents: object[] = [];
  try {
    const filesToReturn = fs.readdirSync(folderPath);
    filesToReturn.forEach((file) => {
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
 * @returns {[]} Returns the path of the selected file or of the directory
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

/**
 * Kills all docker processes
 *
 * @param {number[]} processes A list of the process numbers that are running
 * @param {?string} [containerName] The name of the container to be stopped, if it is known
 */
function killAllProcessess(processes: number[], containerName?: string) {
  const killCommand = formatCommand(`docker kill ${containerName}`);
  if (containerName) exec(killCommand.commandAsString);
  processes.forEach((childPID: number) => {
    console.log(processes);
    try {
      process.kill(childPID, 'SIGKILL');
    } catch (error) {
      console.log(error);
    }
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
ipcMain.handle('killProcess', (event, containerName) => {
  killAllProcessess(allChildProcessess, containerName);
  return 'All child processes killed';
});
ipcMain.handle('getPort', () =>
  portscanner
    .findAPortNotInUse(8888, 9999, '127.0.0.1')
    .then((port) => {
      return port;
    })
    .catch((err) => console.log(err)),
);

/** Function to validate a sudo user. */
async function validateSudoUser() {
  return new Promise((resolve, reject) => {
    // Spawn a new process for sudo
    const sudoUser = spawn('sudo', ['-v', '-S']);
    // Listen for data from stdout of the sudo process
    sudoUser.stdout?.on('data', (out: Buffer) => {
      // Send output to renderer
      mainWindow?.webContents.send('cli-output', `${out.toString()}`);
    });
    // Listen for data from stderr of the sudo process
    sudoUser.stderr?.on('data', (msg: Buffer) => {
      // Send message to renderer to include a password input
      mainWindow?.webContents.send('cli-output', `${msg.toString()}`);
      mainWindow?.webContents.send('ask-pass', true);
      // Pass the returning password from renderer to the child process
      ipcMain.on('pass', (_event2, pwd = '') => {
        // Write the password to stdin of the sudo process
        sudoUser.stdin?.write(`${pwd}\n`);
      });
    });
    sudoUser.on('close', (code) => {
      if (code === 1) {
        reject(new Error(`closed with code:${code}`));
        console.log(`closed with code:${code}`);
        console.log('too many incorrect password attempts');
      } else resolve(true);
      // End the stdin stream
      sudoUser.stdin.end();
    });
  });
}

// async function dockerStart(containerName: string, port: string) {
//   const cmdStartContainer = `docker start ${containerName} -a`;
//   const containerCommand = formatCommand(cmdStartContainer);
//   console.log(containerCommand);
//   const containerProcess = spawn(containerCommand[0], containerCommand[1]);
//   if (containerProcess.pid) {
//     allChildProcessess.push(containerProcess.pid); // Add child process to list of all child processes for killing when exiting app
//   }
//   containerProcess.stderr.on('data', async (data) => {
//     mainWindow?.webContents.send(
//       'cli-output',
//       `DOCKER START: ${data.toString()}`,
//     );
//   });
//   containerProcess.on('exit', (code) => {
//     mainWindow?.webContents.send('cli-output', `Exited with code: ${code}`);
//   });
// }

ipcMain.handle('runCommand', async (_event, givenCommand, port) => {
  // Validate sudo user's credentials if on linux
  if (process.platform === 'linux') {
    // Run command after validating sudo user
    validateSudoUser()
      .then((result) => {
        console.log('Validated sudo user result');
        console.log(result);
        runCommand(givenCommand, port);
      })
      .catch((err: Error) => {
        console.log('Error validating sudo user:');
        console.log(err.message);
      });
  } else {
    runCommand(givenCommand, port);
  }
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
