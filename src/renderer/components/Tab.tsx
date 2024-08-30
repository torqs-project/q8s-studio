import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import xIcon from '../../../assets/icons/closeX.svg';
import { useAppNavigation } from '../contexts/ConsoleContext';

export default function Tab({
  pid,
  index,
  onClick,
  currentTab,
  configName,
}: {
  pid: number;
  index: number;
  onClick: (index: string) => void;
  currentTab: string;
  configName: string;
}) {
  const {
    runningProcesses,
    setRunningProcesses,
    selectedProcess,
    setSelectedProcess,
  } = useAppNavigation();

  const navigate = useNavigate();
  return (
    <div className={pid === index ? 'selected "tabDiv"' : 'tabDiv'}>
      <button
        className={currentTab === configName ? 'selected' : ''}
        type="button"
        onClick={() => {
          onClick('');
          setSelectedProcess(pid);
          // navigate(`/${pid}`);
          // onClick(configName);
        }}
      >
        {pid}
      </button>
      <button type="button" className="close-button">
        <img src={xIcon} alt="" />
      </button>
      {pid === index ? (
        <p>
          selected Tab {pid} {index}{' '}
        </p>
      ) : (
        <p>
          {pid} {index}
        </p>
      )}
      {}
    </div>
  );
}
