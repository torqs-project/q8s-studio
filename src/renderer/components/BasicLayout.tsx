import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ModalWindow from './ModalView';
import ConfigurationView from './ConfigurationView';
import ConfigurationTile from './ConfigurationTile';
/**
 * A layout component that contains the top and bottom footers for the app.
 */
function BasicLayout() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState('');
  let navState = useLocation().state?.navState;
  if (!navState) {
    navState = 'config';
  }
  return (
    <>
      <footer id="top">
        <h1>Qubernetes Studio</h1>
        <div className="navigatorButtons">
          <button
            className={navState === 'config' ? 'selected' : ''}
            type="button"
            onClick={() => {
              // setShowModal('');
              navigate('/', { state: { navState: 'config' } });
            }}
          >
            Configurations
          </button>
          <button
            className={navState === 'environmnent' ? 'selected' : ''}
            type="button"
            onClick={() => {
              // setShowModal('config');
              navigate('/clg', { state: { navState: 'environmnent' } });
            }}
          >
            Environmnent output
          </button>
        </div>
      </footer>
      <div>
        <div className="conf-list">
          <ConfigurationTile
            configName="kubernetes"
            kubePath=""
            workspacePath=""
          />
          <ConfigurationTile
            configName="kubernetes"
            kubePath=""
            workspacePath=""
          />
        </div>

        <Outlet />
        {showModal ? (
          <ModalWindow onClose={() => setShowModal('')}>
            <h1>Test Modal</h1>
            <ConfigurationView />
          </ModalWindow>
        ) : (
          ''
        )}
      </div>
      <footer id="bottom">
        <a
          href="https://github.com/torqs-project/q8s-studio?tab=readme-ov-file#q8s-studio"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              📚
            </span>
            Documentation
          </button>
        </a>
      </footer>
    </>
  );
}
export default BasicLayout;
