import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ModalWindow from './ModalView';
import ConfigurationView from './ConfigurationView';
import ConfigurationsList from './ConfigurationsList';
import { useAppNavigation } from '../contexts/ConsoleContext';
/**
 * A layout component that contains the top and bottom footers for the app.
 */
function BasicLayout() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState('');
  const { navState, setNavState } = useAppNavigation();
  // let navState = useLocation().state?.navState;
  // if (!navState) {
  //   navState = 'config';
  // }
  return (
    <>
      <footer id="top">
        <div className="navigatorButtons">
          <button
            className={navState === 'config' ? 'selected' : ''}
            type="button"
            onClick={() => {
              setShowModal('');
              navigate('/');
              setNavState('config');
            }}
          >
            My Configurations
          </button>
          <button
            id="env"
            className={navState === 'environment' ? 'selected' : ''}
            type="button"
            onClick={() => {
              // setShowModal('config');
              navigate('/clg');
              setNavState('environment');
            }}
          >
            Environment output
          </button>
        </div>
        <div id="footerRight">
          <button
            type="button"
            onClick={() => {
              setShowModal('config');
            }}
          >
            Create new configuration <span>+</span>
          </button>
        </div>
      </footer>
      <div>
        <Outlet />
        {navState === 'config' ? (
          <ConfigurationsList>
            <button
              type="button"
              className="create-plus"
              onClick={() => {
                setShowModal('config');
              }}
            >
              +
            </button>
          </ConfigurationsList>
        ) : (
          ''
        )}
        {showModal ? (
          <ModalWindow onClose={() => setShowModal('')}>
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
