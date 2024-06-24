import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

function Main() {
  return (
    <div>
      <div className="content">

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
