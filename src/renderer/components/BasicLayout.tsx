import { Outlet, useNavigate } from 'react-router-dom';
import { useNavigationState } from '../contexts/ConsoleContext';

/**
 * A layout component that contains the top and bottom footers for the app.
 */
function BasicLayout() {
  const navigate = useNavigate();
  const { navState, setNavState } = useNavigationState();
  console.log(navState);
  return (
    <>
      <footer id="top">
        <h1>Qubernetes Studio</h1>
        <div className="navigatorButtons">
          <button
            className={navState === 'home' ? 'selected' : ''}
            type="button"
            onClick={() => {
              navigate('/');
              setNavState('home');
            }}
          >
            Home
          </button>
          <button
            className={navState === 'console' ? 'selected' : ''}
            type="button"
            onClick={() => {
              navigate('/clg');
              setNavState('console');
            }}
          >
            Console output
          </button>
        </div>
      </footer>
      <div>
        <Outlet />
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
