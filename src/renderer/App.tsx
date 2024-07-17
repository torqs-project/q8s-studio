/* eslint-disable no-console */
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import './App.css';
import React, { useState, useRef } from 'react';
import ConsoleView from './components/ConsoleView';
import FileButton from './components/FileButton';
import BasicLayout from './components/BasicLayout';
import { ConsoleProvider } from './contexts/ConsoleContext';
import ConfigurationView from './components/ConfigurationView';

export interface MainProps {
  kubeconfigName: string;
  kubeconfigPath: string;
  directoryName: string;
  directoryPath: string;
  commandRef: React.RefObject<string>;
  openDialog: (isDirectory: boolean) => Promise<void>;
}

/**
 * Qubernetes Studio App.
 * Handles file and directory states and renders the main layout.
 */
export default function App() {
  return (
    <ConsoleProvider>
      <Router>
        <Routes>
          <Route path="/" element={<BasicLayout />}>
            {/* <Route
              path="/"
              element={
                <ConfigurationView
                  kubeconfigName={kubeconfigName}
                  kubeconfigPath={kubeconfigPath}
                  directoryName={directoryName}
                  directoryPath={directoryPath}
                  commandRef={commandRef}
                  openDialog={openDialog}
                />
              }
            /> */}
            <Route path="/clg" element={<ConsoleView />} />
          </Route>
        </Routes>
      </Router>
    </ConsoleProvider>
  );
}
