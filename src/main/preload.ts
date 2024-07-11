// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

/**
 * API exposed to the renderer process
 * @see https://www.electronjs.org/docs/latest/api/context-bridge
 * @see https://www.electronjs.org/docs/latest/api/ipc-renderer
 * @see https://www.electronjs.org/docs/latest/api/ipc-main
 */
const electronAPI = {
  /**
   * Open a file or directory
   * @param isDirectory if the file is a directory
   * @returns the path of the file or directory
   */
  openFile: (isDirectory: boolean) =>
    ipcRenderer.invoke('openFile', isDirectory),
  /**
   * Runs the given command in main process as a child process
   * @param command the command to run
   * @returns the output of the command
   */
  runCommand: (command: string | null) => {
    return ipcRenderer.invoke('runCommand', command);
  },
  /**
   * Ask the user for a password
   * @param callback the callback to call with the password
   * @returns nothing
   */
  askPass: (callback: (data: boolean) => void) => {
    ipcRenderer.on('ask-pass', (event, data) => callback(data));
  },
  /**
   * Send the password to the main process
   * @param value the password to send
   * @returns nothing
   */
  password: (value: string) => ipcRenderer.send('pass', value),
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

export type ElectronAPI = typeof electronAPI;
