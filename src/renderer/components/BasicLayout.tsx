import { Outlet, useNavigate } from 'react-router-dom';

function BasicLayout() {
  const navigate = useNavigate();
  return (
    <>
      <footer id="top">
        <h1>Qubernetes Studio</h1>
        <div className="navigatorButtons">
          <button type="button" onClick={() => navigate('/')}>
            Home
          </button>
          <button type="button" onClick={() => navigate('clg')}>
            Console output
          </button>
        </div>
      </footer>
      <div>
        <Outlet />
      </div>
      <footer id="bottom">
        <a
          href="https://github.com/torqs-project/q8s-studio"
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
