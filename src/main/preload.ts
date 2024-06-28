// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { IpcRendererEvent, contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  openFile: (isDirectory: boolean) =>
    ipcRenderer.invoke('openFile', isDirectory),
  runCommand: (command: string) => {
    return ipcRenderer.invoke('runCommand', command);
  },
  on(
    channel: string,
    callback: { (event: IpcRendererEvent, arg: any): void; (arg0: any): any },
  ) {
    const subscription = (_event: any, args: any) => callback(args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
