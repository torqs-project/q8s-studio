/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { SetStateAction, useState, useRef } from 'react';

function Main() {
  const [kubeconfigName, setKubeconfigName] = useState();
  const [kubeconfigPath, setKubeconfigPath] = useState();
  const [directoryName, setDirectoryName] = useState();
  const [directoryPath, setDirectoryPath] = useState();
  const commandRef = useRef<string>('');

  const openDirectory = async (mode = 'read') => {
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
  };

  function handleFiles(
    e: {
      target: {
        files: {
          name: SetStateAction<undefined>;
          path: SetStateAction<undefined>;
        }[];
      };
    },
    isDirectory = false,
  ) {
    // Sets file and directory names and paths
    if (isDirectory) {
      setDirectoryName(e.target.files[0].name);
      setDirectoryPath(e.target.files[0].path);
    } else {
      setKubeconfigName(e.target.files[0].name);
      setKubeconfigPath(e.target.files[0].path);
    }
  }
  // If both config file and directory are selected, generate the command
  if (kubeconfigPath && directoryPath) {
    // Generate command
    commandRef.current = `docker run -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
    // Send command through IPC
    window.electron.ipcRenderer.once('ipc-example', (arg) => {
      console.log(arg);
    });
    window.electron.ipcRenderer.sendMessage('ipc-example', [
      commandRef.current,
    ]);
  }
  return (
    <div>
      <div className="content">
        <div>
          <h2>Please select your local files: </h2>
        </div>
        <div className="file">
          <label className="testi" htmlFor="kube-config">
            {kubeconfigName
              ? `Selected file: ${kubeconfigName}`
              : 'Choose a kubeconfig file...'}
            <input
              type="file"
              name="kube-config"
              id="kube-config"
              className="visually-hidden"
              onChange={(event) => handleFiles(event)}
            />
          </label>
          {`Path: ${kubeconfigPath || 'No config path'}`}
        </div>
        {/* Uses webkitdirectory property, which is non-standard */}
        <div className="file">
          <label className="testi" htmlFor="dir">
            {directoryPath
              ? `Selected folder: ${directoryName}`
              : 'Choose a workspace folder...'}
            <input
              type="file"
              name="dir"
              id="dir"
              className="visually-hidden"
              webkitdirectory
              onChange={(event) => handleFiles(event, true)}
            />
          </label>
          {`Path: ${directoryPath || 'No dir path'}`}
        </div>
        {commandRef.current ? (
          <div className="file cmd">
            <h2>Command:</h2>
            <p>{commandRef.current}</p>
          </div>
        ) : (
          ''
        )}
        <div>
          <button
            type="button"
            onClick={() => {
              // Generate command
              commandRef.current = `docker run -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
              // Send command through IPC
              window.electron.ipcRenderer.on('ipc-example', (arg) => {
                console.log(arg);
              });
              window.electron.ipcRenderer.sendMessage('ipc-example', [
                commandRef.current,
              ]);
            }}
          >
            Clik me
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
