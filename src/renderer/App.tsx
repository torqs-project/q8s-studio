/* eslint-disable no-console */
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import React, { useState, useRef } from 'react';
import ConsoleView from './components/ConsoleView';
import FileButton from './components/FileButton';
import BasicLayout from './components/BasicLayout';
import { ConsoleProvider } from './contexts/ConsoleContext';

interface MainProps {
  kubeconfigName: string;
  kubeconfigPath: string;
  directoryName: string;
  directoryPath: string;
  commandRef: React.RefObject<string>;
  openDialog: (isDirectory: boolean) => Promise<void>;
}

/**
 * Includes the main content of the application.
 */
function Main({
  kubeconfigName,
  kubeconfigPath,
  directoryName,
  directoryPath,
  commandRef,
  openDialog,
}: MainProps) {
  const navigate = useNavigate();
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
          <>
            <div className="file cmd">
              <h2>Command to run:</h2>
              <p>{commandRef.current}</p>
            </div>
            <div className="file">
              <button
                type="button"
                onClick={() => {
                  window.electronAPI
                    .runCommand(commandRef.current)
                    .then((result: any) => {
                      console.log(result);
                      navigate('clg', { state: { navState: 'console' } });
                      // setNavState('console');
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
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

/**
 * Qubernetes Studio App.
 * Handles file and directory states and renders the main layout.
 */
export default function App() {
  const [kubeconfigName, setKubeconfigName] = useState('');
  const [kubeconfigPath, setKubeconfigPath] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [directoryPath, setDirectoryPath] = useState('');
  const commandRef = useRef<string>('');

  /**
   * Opens a dialog to select a file or directory.
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
  // Genetare the command to run when configuration file and workspace folder have been selected.
  if (kubeconfigPath && directoryPath) {
    commandRef.current = `docker run --rm --name q8studio -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
  }
  return (
    <ConsoleProvider>
      <Router>
        <Routes>
          <Route path="/" element={<BasicLayout />}>
            <Route
              path="/"
              element={
                <Main
                  kubeconfigName={kubeconfigName}
                  kubeconfigPath={kubeconfigPath}
                  directoryName={directoryName}
                  directoryPath={directoryPath}
                  commandRef={commandRef}
                  openDialog={openDialog}
                />
              }
            />
            <Route path="/clg" element={<ConsoleView />} />
          </Route>
        </Routes>
      </Router>
    </ConsoleProvider>
  );
}
