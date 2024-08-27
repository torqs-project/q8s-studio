import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import ModalWindow from './ModalView';
import ConfigurationView from './ConfigurationView';
import ConfigurationsList from './ConfigurationsList';
import { useAppNavigation } from '../contexts/ConsoleContext';
import darkIcon from '../../../assets/icons/darkMode.svg';
import lightIcon from '../../../assets/icons/lightMode.svg';
import githubLogo from '../../../assets/icons/github-mark.svg';
import githubLogoWhite from '../../../assets/icons/github-mark-white.svg';
/**
 * A layout component that contains the top and bottom footers for the app.
 */
function BasicLayout() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState('');
  const [refreshConfigs, setRefreshConfigs] = useState(false);
  const [darkMode, setDarkMode] = useState();
  const { navState, setNavState } = useAppNavigation();

  useEffect(() => {
    window.electronAPI
      ?.getDarkModeState()
      .then((state) => {
        setDarkMode(state);
        return state;
      })
      .catch((err) => {
        window.console.log(err);
      });
  }, []);
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
          <ConfigurationsList refresh={refreshConfigs}>
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
            <ConfigurationView
              onClose={() => {
                setShowModal('');
                // Refresh configurationsList
                setRefreshConfigs(!refreshConfigs);
              }}
            />
          </ModalWindow>
        ) : (
          ''
        )}
      </div>
      <footer id="bottom">
        <a
          href="https://github.com/torqs-project/q8s-studio?tab=readme-ov-file#contributing"
          target="_blank"
          rel="noreferrer"
        >
          <button type="button">
            <span role="img" aria-label="books">
              <img
                style={{
                  height: '24px',
                  width: '24px',
                  paddingRight: '0.5em',
                }}
                src={darkMode ? githubLogoWhite : githubLogo}
                alt="GitHub logo"
              />
            </span>
            Contribute on GitHub
          </button>
        </a>
        <button
          id="bottomRightFooter"
          type="button"
          onClick={async () => {
            setDarkMode(await window.electronAPI.toggle());
          }}
        >
          {darkMode ? (
            <img src={lightIcon} alt="Light mode icon" />
          ) : (
            <img src={darkIcon} alt="Dark mode icon" />
          )}
        </button>
      </footer>
    </>
  );
}
export default BasicLayout;
