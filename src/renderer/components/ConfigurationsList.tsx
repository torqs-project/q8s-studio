import React, { useState, useEffect } from 'react';
import ConfigurationTile from './ConfigurationTile';
import { SaveFormat } from './ConfigurationView';

interface ConfigListProps {
  children: React.JSX.Element;
  refresh: boolean;
}

function ConfigurationsList({ children, refresh }: ConfigListProps) {
  const [configurations, setConfigurations] = useState<SaveFormat[]>([]);

  const loadFiles = async () => {
    try {
      const result = await window.electronAPI.loadFiles();
      setConfigurations(result);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  };

  useEffect(() => {
    loadFiles()
      .then((result) => {
        window.electronAPI?.checkDocker();
        return result;
      })
      .catch((err) => {
        window.console.log(err);
      });
  }, []);

  useEffect(() => {
    loadFiles();
  }, [refresh]);

  return (
    <div className="conf-list-container">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5em' }}>
        {configurations.length > 0
          ? 'Start an environment:'
          : 'Create a new configuration:'}
      </h2>
      <div className="conf-list">
        {configurations.map((config: SaveFormat) => (
          <ConfigurationTile
            config={config}
            key={config.configurationName}
            refreshConfigsList={loadFiles}
          />
        ))}
        {/* <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" />
      <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" /> */}
        {children}
      </div>
    </div>
  );
}

export default ConfigurationsList;
