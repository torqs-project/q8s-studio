import React, { useState, useEffect } from 'react';
import ConfigurationTile from './ConfigurationTile';

function ConfigurationsList() {
  const [configurations, setConfigurations] = useState<object[]>([]);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const result = await window.electronAPI.loadFiles();
        console.log(result);
        setConfigurations(result);
      } catch (err) {
        console.log(err);
      }
    };

    loadFiles();
  }, []);

  return (
    <div className="conf-list">
      {configurations.map((config) => (
        <ConfigurationTile
          configName={config.configName}
          kubePath={config.kubePath}
          workspacePath={config.workspacePath}
        />
      ))}
      {/* <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" />
      <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" /> */}
    </div>
  );
}

export default ConfigurationsList;
