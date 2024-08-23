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
  nativeTheme,
} from 'electron';

import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { exec, execSync, spawn } from 'child_process';
import fs from 'fs';
import portscanner from 'portscanner';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { SaveFormat } from '../renderer/components/ConfigurationView';

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

function renameContainerName(configurationName: string) {
  return configurationName.trim().replaceAll(' ', '_');
}
/**
 * Formats a command to be used in spawn function.
 *
 * @param {string} commandToformat The command to format
 * @returns An object with the command, arguments, the whole command as a string the container name
 */
function formatCommand(commandToformat: string): {
  command: string;
  commandArgs: string[];
  commandAsString: string;
  containerName: string;
} {
  // Split command to list of arguments
  const splitted = commandToformat.split(' ');
  // Get the command
  const cmd = splitted[0];
  // Get the arguments
  const cmdArgs = splitted.slice(1);
  // eslint-disable-next-line prefer-destructuring
  const containerName = splitted[3];
  const resultObject = {
    command: cmd,
    commandArgs: cmdArgs,
    commandAsString: commandToformat,
    containerName,
  };
  return resultObject;
}

/**
 * Executes a shell command and returns the output as a promise.
 * @param command The shell command to execute.
 * @returns A promise that resolves with the command output.
 */
async function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`Error on command: ${command}`);
        // console.log(`Error: ${error.code}`);
        mainWindow?.webContents.send('errorCode', error.code);
        mainWindow?.webContents.send('error', error);
        return reject(stderr);
      }
      return resolve(stdout);
    });
  });
}

/**
 * Creates an environment manager for the Docker container.
 * This encapsulates container-specific values, reducing the need to pass them around.
 * @param command The Docker command to run.
 * @param commandArgs Arguments for the Docker command.
 * @param containerName The name of the Docker container.
 * @returns An object with methods to manage the Docker environment.
 */
function createEnvManager(
  command: string,
  commandArgs: string[],
  containerName: string,
) {
  return {
    /**
     * Checks if the Docker image exists and handles the container accordingly.
     * This is the main entry point to start the process.
     */
    async checkImage(): Promise<void> {
      try {
        const images = await runCommand(
          `docker image ls --format "{{.Repository}}:{{.Tag}}"`,
        );

        if (images.includes('torqs-project/q8s-devenv')) {
          mainWindow?.webContents.send('image-exists', true);
          await this.checkContainer();
        } else {
          mainWindow?.webContents.send('image-exists', false);
          await this.dockerRun();
        }
      } catch (error) {
        console.error('Error checking image:', error);
        // mainWindow?.webContents.send('image-exists', false);
        await this.dockerRun();
      }
    },

    /**
     * Checks if the container exists and handles it based on its status.
     */
    async checkContainer(): Promise<void> {
      try {
        const containers = await runCommand(
          `docker container ls -a --format "{{.Names}}"`,
        );

        if (containers.includes(containerName)) {
          await this.checkRunningContainers();
        } else {
          await this.dockerRun();
        }
      } catch (error) {
        console.error('Error checking container:', error);
        await this.dockerRun();
      }
    },

    /**
     * Checks if the container is running and handles it based on its status.
     */
    async checkRunningContainers(): Promise<void> {
      try {
        const runningContainers = await runCommand(
          `docker container ls --format "{{.Names}}"`,
        );

        if (runningContainers.includes(containerName)) {
          console.log('IS RUNNING');
          const url = await this.getURL();
          mainWindow?.webContents.send('lab-url', url);
          mainWindow?.webContents.send(
            'cli-output',
            `Environment running on: ${url}`,
          );
        } else {
          console.log('IS NOT RUNNING');
          await this.removeAndRunContainer();
        }
      } catch (error) {
        console.error('Error checking running containers:', error);
        await this.removeAndRunContainer();
      }
    },

    /**
     * Removes the existing container and runs it.
     * Can't use 'docker start' because port cannot be changed on a existing container.
     */
    async removeAndRunContainer(): Promise<void> {
      try {
        console.log(`Remove ${containerName}`);
        await runCommand(`docker container rm ${containerName}`);
        await this.dockerRun();
      } catch (error) {
        console.error('Error removing and running container:', error);
        await this.dockerRun();
      }
    },

    /**
     * Gets the URL of the container.
     * @async
     */
    async getURL() {
      const commandNormalized =
        process.platform === 'win32'
          ? `docker inspect --format="{{(index (index .NetworkSettings.Ports \\"8888/tcp\\") 0).HostPort}}" ${containerName}`
          : `docker inspect --format='{{(index (index .NetworkSettings.Ports "8888/tcp") 0).HostPort}}' ${containerName}`;
      console.log(commandNormalized);
      // Get the host port of the container
      const port = await runCommand(commandNormalized);
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
    },
    /**
     * Spawns a child process for the docker container and sends the output to the renderer
     */
    async dockerRun() {
      try {
        const dockerProcess = spawn(command, commandArgs);
        if (dockerProcess.pid) {
          allChildProcessess.push(dockerProcess.pid); // Add child process to list of all child processes for killing when exiting app
        }
        // Handle stdio
        // For some reason output from docker goes to stderr instead of stdout.
        dockerProcess.stderr?.on('data', async (msg: Buffer) => {
          mainWindow?.webContents.send('cli-output', `${msg.toString()}`);
          if (msg.toString().includes('To access the server')) {
            const url = await this.getURL();
            mainWindow?.webContents.send('lab-url', url);
            mainWindow?.webContents.send(
              'cli-output',
              `Environment running on: ${url}`,
            );
          }
          console.log(`stderr on dockerRun ${msg.toString()}`);
          return `ERROR ON SPAWNING DOCKER PROCESS ${msg.toString()}`;
        });
        dockerProcess.on('exit', (code) => {
          mainWindow?.webContents.send(
            'cli-output',
            `Exited with code: ${code}`,
          );
          switch (code) {
            case 125:
              dialog.showErrorBox(
                'Error with docker daemon',
                `Remember to start docker. If Docker is not installed on your machine, download it from: \nhttps://www.docker.com/`,
              );
              console.log('Error with docker daemon');
              break;
            case 126:
              console.log('Error with docker command');
              break;
            case 127:
              console.log('Error with docker command not found');
              break;
            default:
              break;
          }
          if (dockerProcess.pid) {
            const remIndex = allChildProcessess.indexOf(dockerProcess.pid);
            if (remIndex > -1) {
              allChildProcessess.splice(remIndex, 1); // Remove child process from list of all child processes
            }
          }
        });
      } catch (error) {
        console.log(`Error: ${error}`);
      }
    },
  };
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
  if (containerName) exec(`docker kill ${containerName}`);
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
ipcMain.handle('dark-mode:get-state', () => {
  return nativeTheme.shouldUseDarkColors;
});
ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }
  return nativeTheme.shouldUseDarkColors;
});
ipcMain.handle('checkDocker', async () => {
  try {
    await runCommand(`docker info`);
  } catch (error) {
    console.log(`Error docker: ${error}`);
    dialog.showErrorBox(
      'Qubernetes Studio needs Docker to work.',
      `Remember to start docker. If Docker is not installed on your machine, download it from: \nhttps://www.docker.com/`,
    );
  }
});
ipcMain.handle('killProcess', (event, configurationName) => {
  killAllProcessess(allChildProcessess, renameContainerName(configurationName));
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

ipcMain.handle(
  'runCommand',
  async (_event, givenConfigurations: SaveFormat) => {
    const command = 'docker';
    // Change configuration name to a valid docker name

    const containerName = renameContainerName(
      givenConfigurations.configurationName,
    );
    const availablePort = await portscanner.findAPortNotInUse(
      8888,
      9999,
      '127.0.0.1',
    );
    // Create the docker command arguments
    const commandArgs = [
      'run',
      '--name',
      containerName,
      '-p',
      `${availablePort}:8888`,
      '-v',
      `${givenConfigurations.kubeconfigPath}:/home/jupyter/.kube/config`,
      '-v',
      `${givenConfigurations.directoryPath}:/workspace`,
      '--pull',
      'always',
      'ghcr.io/torqs-project/q8s-devenv:main',
    ];

    console.log(commandArgs);
    const envManager = createEnvManager(command, commandArgs, containerName);
    // Check if docker command exists
    try {
      await runCommand(`docker images`);
    } catch (error) {
      console.log(`Error docker: ${error}`);
      dialog.showErrorBox(
        'Error starting Docker',
        `Remember to start docker. If Docker is not installed on your machine, download it from: \nhttps://www.docker.com/`,
      );
      return;
    }
    // Start the docker process
    envManager.checkImage();
  },
);

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
