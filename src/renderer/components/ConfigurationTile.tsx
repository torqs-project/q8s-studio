/* eslint-disable no-console */
import React, { useEffect } from 'react';
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
  const { setNavState, setEnvName, runningProcesses, setRunningProcesses } =
    useAppNavigation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('changed runningProcesses');
    console.log(runningProcesses);
  }, [runningProcesses]);

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
          setNavState(configurationName);
          setEnvName(configurationName);
          navigate(`/`);
          console.log('aölksdfaösfj');
          window.electronAPI
            .runCommand(config, portToUse.toString())
            .then((result: number) => {
              console.log('run command result', result);
              console.log('runningProcesses', runningProcesses);
              const newArr: number[] = runningProcesses.concat(result);
              console.log('newArray is', newArr);
              setRunningProcesses(newArr);
              console.log('runningProcesses updated', runningProcesses);
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
