// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  openFile: (isDirectory: boolean) =>
    ipcRenderer.invoke('openFile', isDirectory),
  runCommand: (command: string) => {
    return ipcRenderer.invoke('runCommand', command);
  },
  askPass: (callback: (data: boolean) => void) => {
    ipcRenderer.on('ask-pass', (event, data) => callback(data));
  },
  password: (value: string) => ipcRenderer.send('pass', value),
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
