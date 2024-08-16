/* eslint-disable no-console */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import runIcon from '../../../assets/icons/run.svg';
import deleteIcon from '../../../assets/icons/delete.svg';
import { SaveFormat } from './ConfigurationView';
import { useAppNavigation } from '../contexts/ConsoleContext';

interface ConfigurationTileProps {
  config: SaveFormat;
  refreshConfigsList: () => Promise<void>;
}
/**
 * A tile that shows the saved environment configuration.
 */
export default function ConfigurationTile({
  config,
  refreshConfigsList,
}: ConfigurationTileProps): React.JSX.Element {
  const { configurationName } = config;
  const { setNavState, setEnvName } = useAppNavigation();
  const navigate = useNavigate();
  return (
    <div className="tile-div">
      <button
        className="tile-btn"
        type="button"
        onClick={async () => {
          const portToUse = await window.electronAPI
            .getPort()
            .then((newportToUse) => {
              return newportToUse;
            })
            .catch((err) => {
              console.log(err);
              return 0;
            });
          navigate('/clg');
          setNavState('environment');
          setEnvName(configurationName);
          window.electronAPI
            .runCommand(config, portToUse.toString())
            .then((result: any) => {
              return result;
            })
            .catch(() => {});
        }}
      >
        <span> {configurationName}</span> <img src={runIcon} alt="" />
      </button>
      <button
        className="del-btn"
        type="button"
        onClick={() => {
          window.electronAPI
            .deleteFile(configurationName)
            .then((result) => {
              // TODO: refresh list
              refreshConfigsList();
              return result;
            })
            .catch(() => {
              // console.log(err);
            });
        }}
      >
        {' '}
        <img src={deleteIcon} alt="" />{' '}
      </button>
    </div>
  );
}
