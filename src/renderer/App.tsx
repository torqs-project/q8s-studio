/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import React, { useState, useRef, useEffect } from 'react';

/**
 * A div with the console inside.
 *
 * Listens on IPC for output, and possibly for a password prompt.
 * If password is needed, the prompt is shown for the user and password is forwarded to the main process.
 * @returns {React.JSX.Element}
 */
function ConsoleView(): React.JSX.Element {
  const [output, setOutput] = useState<React.JSX.Element[]>([]);
  const [showPassInput, setShowPassInput] = useState(false);
  const [labUrl, setLabUrl] = useState('');
  const [pKey, setPKey] = useState(0);
  // Add auto-scroll to the bottom of the console
  useEffect(() => {
    const consoleDivPass = document.querySelector('.console>.output-pass');
    // console.log(consoleDivPass);
    consoleDivPass?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    });
    const consoleDiv = document.querySelector('.console>.output');
    // console.log(consoleDiv);
    consoleDiv?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    });
  }, [output]);
  // Add a listener to the channel cli-output
  if (window.electronAPI) {
    window.electronAPI.on('cli-output', (_event, data) => {
      setPKey(pKey + 1);
      const newline: React.JSX.Element = <p key={pKey}>{data}</p>;
      setOutput([...output, newline]);
    });
    window.electronAPI.askPass((needsPassword: boolean) => {
      setShowPassInput(needsPassword);
    });
    window.electronAPI.labUrl((labUrlFromMain: string) => {
      setLabUrl(labUrlFromMain);
    });
  }
  return (
    <div>
      <div className={labUrl ? 'file' : 'file hidden'}>
        {labUrl ? (
          <>
            <button
              type="button"
              onClick={() => {
                console.log(labUrl);
                window.open(labUrl);
              }}
            >
              Open Jupyter Lab in default browser
            </button>
            <p>{labUrl}</p>
          </>
        ) : (
          ''
        )}
      </div>
      <div className="console file">
        <p>Command output:</p>
        <div className={showPassInput ? 'output-pass' : 'output-pass hidden'}>
          {output}{' '}
          <div>
            {/* Password promt */}
            {showPassInput ? (
              // eslint-disable-next-line jsx-a11y/label-has-associated-control
              <label className="pass">
                <input type="password" />
                <button
                  type="button"
                  onClick={(event) => {
                    const clickedButton = event.target;
                    const passInput: HTMLInputElement | null = (
                      clickedButton as HTMLElement
                    ).previousElementSibling as HTMLInputElement;
                    // console.log(passInput?.value);
                    window.electronAPI?.password(
                      (passInput.value as string) || '',
                    );
                    setShowPassInput(false);
                  }}
                >
                  OK
                </button>
              </label>
            ) : (
              ''
            )}
          </div>
        </div>
        <div className={showPassInput ? 'output hidden' : 'output'}>
          {output}{' '}
        </div>
      </div>
    </div>
  );
}
interface fileButtonProps {
  name: string;
  path: string;
  isDirectory?: boolean;
  openDialog: (isDirectory: boolean) => void;
}
/**
 * A component to display a button for selecting a file or directory.
 */
function FileButton({
  name,
  path,
  isDirectory = false,
  openDialog,
}: fileButtonProps) {
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

  const openDialog = async (isDirectory = false) => {
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
        <ConsoleView />
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
