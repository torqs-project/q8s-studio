// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (isDirectory: boolean) => ipcRenderer.invoke('openFile', isDirectory)
})








// const ipcHandler = {
//   test: () => {
//     ipcRenderer.send('test', 'testiiijöajfsölkdjföalkfjlk');
//   },
// };

// contextBridge.exposeInMainWorld('ipc', ipcHandler);

// export type TestHandler = typeof ipcHandler;
