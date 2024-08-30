import React, { useState, useEffect } from 'react';
import { useAppNavigation } from '../contexts/ConsoleContext';
import Tab from './Tab';

export default function TabContainer() {
  const { navState, envName } = useAppNavigation();
  const { runningProcesses, setRunningProcesses } = useAppNavigation();

  const getProcesses = async () => {
    try {
      const result = await window.electronAPI.getRunningProcesses();
      console.log(result);
      // setRunningProcesses(result);
      return result;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  useEffect(() => {
    console.log('navState or envName changed', navState, envName);
    console.log('runningProcesses', runningProcesses);
    console.log(getProcesses());
  }, [navState, envName, runningProcesses]);

  return (
    <div>
      {runningProcesses.map((proc) => (
        <Tab
          key={proc}
          pid={proc}
          configName={envName}
          index={proc}
          onClick={(index: string): void => {
            const ps = getProcesses();
            console.log(ps);
            console.log('click');
            console.log('index', index);
          }}
          currentTab=""
        />
      ))}
      {/* {tabs.map((tab) => (
        <Tab key={tab} configName={tab} />
      ))} */}
    </div>
  );
}
