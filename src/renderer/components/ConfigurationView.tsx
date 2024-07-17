import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import FileButton from './FileButton';

/**
 * The configuration view.
 * Handles file and directory states and renders the configuration view.
 */
export default function ConfigurationView() {
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
                      navigate('clg', { state: { navState: 'console' } });
                      // setNavState('console');
                      return result;
                    })
                    .catch(() => {});
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
