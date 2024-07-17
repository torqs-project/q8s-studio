import React, { useState, useEffect } from 'react';
import ConfigurationTile from './ConfigurationTile';

function ConfigurationsList({children}) {
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
          configName={config.name}
          kubePath={config.description}
          workspacePath={config.config}
        />
      ))}
      {/* <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" />
      <ConfigurationTile configName="kubernetes" kubePath="" workspacePath="" /> */}
      {children}
    </div>
  );
}

export default ConfigurationsList;
