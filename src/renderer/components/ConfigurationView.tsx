import { useState, useRef } from 'react';
import FileButton from './FileButton';

export type SaveFormat = {
  configurationName: string;
  kubeconfigPath: string;
  directoryPath: string;
};

/**
 * The configuration view.
 * Handles file and directory states and renders the configuration view.
 */
export default function ConfigurationView() {
  const [kubeconfigName, setKubeconfigName] = useState('');
  const [kubeconfigPath, setKubeconfigPath] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [directoryPath, setDirectoryPath] = useState('');
  const [configurationName, setConfigurationName] = useState('');
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
        if (!configurationName) {
          setConfigurationName(name);
        }
      }
    }
  };
  // Genetare the command to run when configuration file and workspace folder have been selected.
  if (kubeconfigPath && directoryPath) {
    commandRef.current = `docker run --rm --name q8studio -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
  }
  return (
    <div>
      <div className="content">
        <div className="input-div">
          <label className="text-input" htmlFor="name">
            <span>Configuration name</span>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="text"
              name="name"
              id="name"
              value={configurationName}
              onChange={(e) => setConfigurationName(e.target.value)}
            />
          </label>
        </div>
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
          <div className="file">
            <button
              type="button"
              className="save-button"
              onClick={() => {
                const objectToSave: SaveFormat = {
                  configurationName,
                  kubeconfigPath,
                  directoryPath,
                };
                window.electronAPI.writeFile(configurationName, objectToSave);
                // window.electronAPI
                //   .runCommand(commandRef.current)
                //   .then((result: any) => {
                //     navigate('clg', { state: { navState: 'console' } });
                //     // setNavState('console');
                //     return result;
                //   })
                //   .catch(() => {});
              }}
            >
              <svg
                width="30px"
                height="30px"
                strokeWidth="1.7"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="white"
              >
                <path
                  d="M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z"
                  stroke="white"
                  strokeWidth="1.7"
                />
                <path
                  d="M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z"
                  stroke="white"
                  strokeWidth="1.7"
                />
                <path
                  d="M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z"
                  stroke="white"
                  strokeWidth="1.7"
                />
              </svg>
              Save configuration
            </button>
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}
