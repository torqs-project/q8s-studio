/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useState, useRef } from 'react';

interface fileButtonProps {
  name: string;
  path: string;
  isDirectory?: boolean;
  openDialog: (isDirectory: boolean) => void;
}
function FileButton({
  name,
  path,
  isDirectory = false,
  openDialog,
}: fileButtonProps) {
  console.log(path);
  const text = isDirectory
    ? 'Choose a workspace folder...'
    : 'Choose a kubernetes configuration file...';
  return (
    <div className="file">
      <button
        type="button"
        className="file-button"
        onClick={() => openDialog(isDirectory)}
      >
        {path ? `Selected ${isDirectory ? 'folder' : 'file'}: ${name}` : text}
      </button>
      <span>{path ? `Path: ${path}` : ''}</span>
    </div>
  );
}
FileButton.defaultProps = {
  isDirectory: false,
};

function Main() {
  const [kubeconfigName, setKubeconfigName] = useState('');
  const [kubeconfigPath, setKubeconfigPath] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [directoryPath, setDirectoryPath] = useState('');
  const commandRef = useRef<string>('');

  /* const openDirectory = async (mode = 'read') => {
    // Following code is from:
    // https://web.dev/patterns/files/open-a-directory#progressive_enhancement
    // It is used for selecting just a directory
    // Feature detection. The API needs to be supported
    // and the app not run in an iframe.
    const supportsFileSystemAccess =
      'showDirectoryPicker' in window &&
      (() => {
        try {
          return window.self === window.top;
        } catch {
          return false;
        }
      })();
    // If the File System Access API is supported…
    if (supportsFileSystemAccess) {
      let directoryStructure;
      try {
        // Open the directory.
        const handle = await window.showDirectoryPicker();
        // Get the directory structure.
        directoryStructure = handle;
        console.log('handle:');
        console.log(handle);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err.name, err.message);
        }
      }
      return directoryStructure;
    }
    // Fallback if the File System Access API is not supported.
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;

      input.addEventListener('change', () => {
        const files = Array.from(input.files);
        resolve(files);
      });
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker();
      } else {
        input.click();
      }
    });
  }; */

  const openDialog = async (isDirectory = false) => {
    const filePath = await window.electronAPI.openFile(isDirectory);
    console.log(filePath);
    const regex = /\/|\\/;
    const pathArray = filePath.split(regex);
    const name = pathArray[pathArray.length - 1];
    console.log(name);
    if (isDirectory) {
      setDirectoryName(name);
      setDirectoryPath(filePath);
    } else {
      console.log(name);
      setKubeconfigName(name);
      setKubeconfigPath(filePath);
    }
  };
  // If both config file and directory are selected, generate the command
  if (kubeconfigPath && directoryPath) {
    // Generate command
    commandRef.current = `docker run -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
    // Send command through IPC
    // window.electron.ipcRenderer.once('ipc-example', (arg) => {
    //   console.log(arg);
    // });
    // window.electron.ipcRenderer.sendMessage('ipc-example', [
    //   commandRef.current,
    // ]);
    // window.electron.ipcRenderer.send('test', 'test');
  }
  return (
    <div>
      <div className="content">
        <div>
          <h2>Please select your local files: </h2>
        </div>
        <FileButton
          name={kubeconfigName}
          path={kubeconfigPath}
          openDialog={openDialog}
        />
        <FileButton
          name={directoryName}
          path={directoryPath}
          isDirectory
          openDialog={openDialog}
        />
        {/* Uses webkitdirectory property, which is non-standard */}
        {/* <div className="file">
          <label className="testi" htmlFor="dir">
            {directoryPath
              ? `Selected folder: ${directoryName}`
              : 'Choose a workspace folder...'}
            <button
              name="dir"
              id="dir"
              className="visually-hidden"
              webkitdirectory="true"
              onChange={() => openDialog(true)}
            />
          </label>
          {`Path: ${directoryPath || 'No dir path'}`}
        </div> */}
        {commandRef.current ? (
          <div className="file cmd">
            <h2>Command to run:</h2>
            <p>{commandRef.current}</p>
          </div>
        ) : (
          ''
        )}
        <div>
          <button
            disabled={!(kubeconfigPath && directoryPath)}
            type="button"
            // onClick={openDialog}
            onClick={async () => {
              // Generate command
              // commandRef.current = `docker run -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
              // // Send command through IPC
              window.electronAPI
                .runCommand(commandRef.current)
                .then((result: any) => {
                  console.log(`RESULT:${result}`);
                  return 'ölkajsdf';
                })
                .catch((err: any) => {
                  console.log(err);
                });
              window.electronAPI.on('cli-output', (event) => {
                console.log(event);
                // console.log(arg);
              });
              // ipcRenderer.on('cli-output', (event, arg) => {
              //   console.log(arg);
              // });
            }}
          >
            Run command
          </button>
        </div>

        {/* Here a version which is standard, but can't find the path for security reasons */}
        {/* <div className="file">
          <button
            type="button"
            onClick={async () => {
              const directoryHandle = await openDirectory();
              console.log(directoryHandle.values());
              console.log(directoryHandle.name);
              setDirectoryName(directoryHandle.name);
              setDirectoryPath(directoryHandle.path);
              console.log(directoryPath);
            }}
          >
            {directoryName
              ? `Selected directory: ${directoryName}`
              : 'Choose workspace directory...'}
          </button>
          {directoryPath?directoryPath:"No dir path"}
        </div> */}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
