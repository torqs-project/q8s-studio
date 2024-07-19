import React, { useState, useEffect, PropsWithChildren } from 'react';
import ConfigurationTile from './ConfigurationTile';
import { SaveFormat } from './ConfigurationView';

function ConfigurationsList({ children }: PropsWithChildren) {
  const [configurations, setConfigurations] = useState<SaveFormat[]>([]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const result = await window.electronAPI.loadFiles();
        setConfigurations(result);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    };

    loadFiles();
  }, []);

  return (
    <div className="conf-list-container">
      <h2 style={{ textAlign: 'center', marginBottom: '1.5em' }}>
        {configurations.length > 0
          ? 'Start an environment:'
          : 'Create a new environment:'}
      </h2>
      <div className="conf-list">
        {configurations.map((config: SaveFormat) => (
          <ConfigurationTile config={config} key={config.configurationName} />
        ))}
        {/* <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" />
      <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" /> */}
        {children}
      </div>
    </div>
  );
}

export default ConfigurationsList;
