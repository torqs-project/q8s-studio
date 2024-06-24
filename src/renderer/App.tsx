/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { open } from 'fs/promises';

function Main() {



  return (
    <div>
      <div className="content">
        <div>
          <p>test content</p>
        </div>
        <div className="file">
          <input
            type="file"
            name="kube-config"
            id="kube-config"
            accept=".yaml,.yml"
          />
          <label htmlFor="kube-config"> test label </label>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
