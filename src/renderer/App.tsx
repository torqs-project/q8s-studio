/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ConsoleView from './components/ConsoleView';
import BasicLayout from './components/BasicLayout';
import { ConsoleProvider } from './contexts/ConsoleContext';

/**
 * Qubernetes Studio App.
 * Handles the routing and provides the ConsoleProvider.
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
