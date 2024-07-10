/* eslint-disable no-console */
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Outlet,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import React, { useState, useRef } from 'react';
import ConsoleView from './components/ConsoleView';
import FileButton from './components/FileButton';

function Main() {
  const [kubeconfigName, setKubeconfigName] = useState('');
  const [kubeconfigPath, setKubeconfigPath] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [directoryPath, setDirectoryPath] = useState('');
  const commandRef = useRef<string>('');
  const navigate = useNavigate();
  /**
   * Fires the event to open a file dialog and sets the selected file path
   *
   * @async
   * @param {boolean} [isDirectory=false] Is the file a directory or not
   */
  const openDialog = async (isDirectory: boolean = false) => {
    const filePath = await window.electronAPI.openFile(isDirectory);
    if (filePath) {
      const regex = /\/|\\/;
      const pathArray = filePath.split(regex);
      const name = pathArray[pathArray.length - 1];
      if (isDirectory) {
        setDirectoryName(name);
        setDirectoryPath(filePath);
      } else {
        setKubeconfigName(name);
        setKubeconfigPath(filePath);
      }
    }
  };
  // If both config file and directory are selected, generate the command
  if (kubeconfigPath && directoryPath) {
    // Generate command
    commandRef.current = `docker run --rm --name q8studio -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
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
        {commandRef.current ? (
          <div className="file cmd">
            <h2>Command to run:</h2>
            <p>{commandRef.current}</p>
          </div>
        ) : (
          ''
        )}
        <div className="file">
          <button
            disabled={!(kubeconfigPath && directoryPath)}
            type="button"
            onClick={() => {
              // Generate command
              // commandRef.current = `docker run --name test -p 8888:8888 -v test:/home/jupyter/.kube/config -v test:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
              // Send command through IPC
              window.electronAPI
                .runCommand(commandRef.current)
                .then((result: any) => {
                  console.log(result);
                  navigate('clg');
                  return result;
                })
                .catch((err: any) => {
                  console.log(err);
                });
            }}
          >
            Run command
          </button>
        </div>
      </div>
    </div>
  );
}

function BasicLayout() {
  const navigate = useNavigate();
  return (
    <>
      <footer id="top">
        <h1>Qubernetes Studio</h1>
        <div className="navigatorButtons">
          <button type="button" onClick={() => navigate('/')}>
            Home
          </button>
          <button type="button" onClick={() => navigate('clg')}>
            Console output
          </button>
        </div>
      </footer>
      <div>
        <Outlet />
      </div>
      <footer id="bottom">
        <a
          href="https://github.com/torqs-project/q8s-studio"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Documentation
          </button>
        </a>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BasicLayout />}>
          <Route path="/" element={<Main />} />
          <Route path="/clg" element={<ConsoleView />} />
        </Route>
      </Routes>
    </Router>
  );
}
