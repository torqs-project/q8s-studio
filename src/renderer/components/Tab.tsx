import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import xIcon from '../../../assets/icons/closeX.svg';

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
  const navigate = useNavigate();
  return (
    <div className="tabDiv">
      <button
        className={currentTab === configName ? 'selected' : ''}
        type="button"
        onClick={() => {
          onClick('');
          navigate(`/${pid}`);
          // onClick(configName);
        }}
      >
        {index}
      </button>
      <button type="button" className="close-button">
        <img src={xIcon} alt="" />
      </button>
    </div>
  );
}
