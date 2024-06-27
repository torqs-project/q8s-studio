// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (isDirectory: boolean) => ipcRenderer.invoke('openFile', isDirectory),
  runCommand: (command: string) => {ipcRenderer.invoke('runCommand', command)},
});

