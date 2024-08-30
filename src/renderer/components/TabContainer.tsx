import React, { useState, useEffect } from 'react';
import { useAppNavigation } from '../contexts/ConsoleContext';
import Tab from './Tab';

export default function TabContainer() {
  const { navState, envName } = useAppNavigation();
  const { runningProcesses, setRunningProcesses, selectedProcess } =
    useAppNavigation();

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
    console.log('selected process changed', selectedProcess);
    console.log(runningProcesses);
  }, [selectedProcess]);

  useEffect(() => {
    console.log('navState or envName changed', navState, envName);
    console.log('runningProcesses', runningProcesses);
    console.log(getProcesses());
  }, [navState, envName, runningProcesses]);

  return (
    <div>
      {runningProcesses.map((pid) => (
        <Tab
          key={pid}
          pid={pid}
          configName={envName}
          index={selectedProcess}
          onClick={(): void => {
            console.log('click');
            console.log('index', selectedProcess);
            console.log('pid', pid);
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
