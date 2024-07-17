import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import ModalWindow from './ModalView';
import ConsoleView from './ConsoleView';
/**
 * A layout component that contains the top and bottom footers for the app.
 */
function BasicLayout() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState('');
  let navState = useLocation().state?.navState;
  if (!navState) {
    navState = 'home';
  }
  return (
    <>
      <footer id="top">
        <h1>Qubernetes Studio</h1>
        <div className="navigatorButtons">
          <button
            className={navState === 'home' ? 'selected' : ''}
            type="button"
            onClick={() => {
              setShowModal('');
              // navigate('/', { state: { navState: 'home' } });
            }}
          >
            Home
          </button>
          <button
            className={navState === 'console' ? 'selected' : ''}
            type="button"
            onClick={() => {
              setShowModal('config');
              // navigate('/clg', { state: { navState: 'console' } });
            }}
          >
            Console output
          </button>
        </div>
      </footer>
      <div>
        <Outlet />
        {showModal ? (
          <ModalWindow onClose={() => setShowModal('')}>
            <h1>Test Modal</h1>
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
