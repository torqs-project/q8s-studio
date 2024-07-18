import React from 'react';
import { useNavigate } from 'react-router-dom';
import runIcon from '../../../assets/icons/run.svg';
import { SaveFormat } from './ConfigurationView';

interface ConfigurationTileProps {
  config: SaveFormat;
}
/**
 * A tile that shows the saved environment configuration.
 */
export default function ConfigurationTile({
  config,
}: ConfigurationTileProps): React.JSX.Element {
  const { configurationName, kubeconfigPath, directoryPath } = config;
  console.log(configurationName);
  const navigate = useNavigate();
  return (
    <button
      className="tile"
      type="button"
      onClick={() => {
        const commandToRun = `docker run --rm --name ${configurationName} -p 8888:8888 -v ${kubeconfigPath}:/home/jupyter/.kube/config -v ${directoryPath}:/workspace --pull always ghcr.io/torqs-project/q8s-devenv:main`;
        window.electronAPI
          .runCommand(commandToRun)
          .then((result: any) => {
            navigate('clg', { state: { navState: 'console' } });
            // setNavState('console');
            return result;
          })
          .catch(() => {});
      }}
    >
      <span> {configurationName}</span> <img src={runIcon} alt="" />
    </button>
  );
}
