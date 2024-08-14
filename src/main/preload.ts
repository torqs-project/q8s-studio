// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';
import { SaveFormat } from '../renderer/components/ConfigurationView';

/**
 * API exposed to the renderer process
 * @see https://www.electronjs.org/docs/latest/api/context-bridge
 * @see https://www.electronjs.org/docs/latest/api/ipc-renderer
 * @see https://www.electronjs.org/docs/latest/api/ipc-main
 */
const electronAPI = {
  writeFile: (fileName: string, content: object) =>
    ipcRenderer.invoke('writeFile', fileName, content),
  deleteFile: (fileName: string) => ipcRenderer.invoke('deleteFile', fileName),
  loadFiles: (): Promise<SaveFormat[]> => {
    return ipcRenderer.invoke('loadFiles');
  },
  /**
   * Open a file or directory
   * @param isDirectory if the file is a directory
   * @returns the path of the file or directory
   */
  openFile: (isDirectory: boolean) =>
    ipcRenderer.invoke('openFile', isDirectory),
  getPort: () => ipcRenderer.invoke('getPort').then((port) => port as number),
  /**
   * Runs the given command in main process as a child process
   * @param command the command to run
   * @returns the output of the command
   */
  runCommand: (command: string | null, port: string) => {
    return ipcRenderer.invoke('runCommand', command, port);
  },
  /**
   * Kill the child process of the environment (docker container) and return the exit message.
   * @param containerName string
   * @returns Message for killing the process
   */
  killProcess: (containerName: string) => {
    return ipcRenderer.invoke('killProcess', containerName);
  },
  /**
   * Ask the user for a password
   * @param callback the callback to call with the password
   * @returns nothing
   */
  askPass: (callback: (data: boolean) => void) => {
    ipcRenderer.on('ask-pass', (event, data) => callback(data));
  },
  checkDocker: () => ipcRenderer.invoke('checkDocker'),
  /**
   * Send the password to the main process
   * @param value the password to send
   * @returns nothing
   */
  password: (value: string) => ipcRenderer.send('pass', value),
  /**
   * Sends boolean value to renderer process to check if a docker image exists
   * @param callback
   */
  imageExists: (callback: (value: boolean) => void) => {
    ipcRenderer.on('image-exists', (event, value) => callback(value));
  },
  /**
   * Get the lab url from the main process
   * @param callback the callback to call with the url
   * @returns nothing
   */
  labUrl: (callback: (url: string) => void) => {
    ipcRenderer.on('lab-url', (event, url) => callback(url));
  },
  /**
   * Listen to an event from the main process
   * @param channel the channel to listen to
   * @param callback the callback to call when the event is triggered
   * @returns a function to remove the listener
   */
  on(
    channel: string,
    callback: {
      (event: IpcRendererEvent, data: string | number): void;
    },
  ) {
    const subscription = (_event: any, args: any) => callback(_event, args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

electronAPI.on('image-exists', (event, value) => {
  console.log('image-exists', value);
});
electronAPI.on('cli-output', (event, value) => {
  console.log('cli-output', value);
});

export type ElectronAPI = typeof electronAPI;
