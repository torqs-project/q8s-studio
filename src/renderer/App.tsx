/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useEffect, useRef } from 'react';
import ConsoleView from './components/ConsoleView';
import BasicLayout from './components/BasicLayout';
import {
  ConsoleProvider,
  NavigationProvider,
  useAppNavigation,
} from './contexts/ConsoleContext';

/**
 * Qubernetes Studio App.
 * Handles the routing and provides the ConsoleProvider.
 */
export default function App() {
  const { envName, runningProcesses, setRunningProcesses } = useAppNavigation();

  const first = useRef([]);

  useEffect(() => {
    console.log('changed runningProcesses in APPPP');
    console.log(runningProcesses);
    first.current = runningProcesses.map((process) => (
      <Route
        key={process}
        path="/:process"
        element={<ConsoleView process={process} />}
      />
    ));
  }, [runningProcesses, envName]);

  return (
    <NavigationProvider>
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
              {/* <Route path="/clg" element={<ConsoleView />} /> */}
              {/* {runningProcesses.map((process) => (
                <Route
                  key={process}
                  path={`/${process}`}
                  element={<ConsoleView process={process} />}
                />
              ))} */}
              {runningProcesses.map((process) => (
                <Route
                  key={process}
                  path="/:process"
                  element={<ConsoleView process={process} />}
                />
              ))}
            </Route>
          </Routes>
        </Router>
      </ConsoleProvider>
    </NavigationProvider>
  );
}
