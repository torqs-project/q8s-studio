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
      const firstFile = e.target.files[0];
      if (firstFile) {
        const { name } = firstFile;
        const { path } = firstFile;
        // split the path and use regexp to find both forward and backwards slashes
        const regexp = /\/|\\/;
        const pathArray = path.split(regexp);
        // get the last element of the array
        const lastElement = pathArray[pathArray.length - 1];
        // set the directory name and path
        console.log(pathArray);
        console.log(name);
        console.log(path);
      } else {
        console.log('thja folder');
        console.log(e);
      }
      // setKubeconfigName();
      // setKubeconfigPath();
    } else {
      setKubeconfigName(e.target.files[0].name);
      setKubeconfigPath(e.target.files[0].path);
    }
  }
  async function openDialog(isDirectory = false) {
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
  }
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
  function FileButton({ name, path, isDirectory = false }) {
    console.log(path);
    const text = isDirectory
      ? 'Choose a workspace folder...'
      : 'Choose a kubernetes configuration file...';
    return (
      <div className="file">
        <button className="file-button" onClick={() => openDialog(isDirectory)}>
          {path ? `Selected ${isDirectory ? 'folder' : 'file'}: ${name}` : text}
        </button>
        <span>{path ? `Path: ${path}` : ''}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="content">
        <div>
          <h2>Please select your local files: </h2>
        </div>
        <FileButton name={kubeconfigName} path={kubeconfigPath} />
        <FileButton name={directoryName} path={directoryPath} isDirectory />
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
            <h2>Command:</h2>
            <p>{commandRef.current}</p>
          </div>
        ) : (
          ''
        )}
        <div>
          <button
            type="button"
            onClick={openDialog}
            // onClick={async () => {
            //   // Generate command
            //   // commandRef.current = `docker run -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
            //   // // Send command through IPC
            //   // window.electron.ipcRenderer.on('ipc-example', (arg) => {
            //   //   console.log(arg);
            //   // });
            //   // window.electron.ipcRenderer.sendMessage('ipc-example', [
            //   //   commandRef.current,
            //   // ]);
            // }}
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
