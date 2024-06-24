/* eslint-disable no-console */
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { useState } from 'react';

function Main() {
  const [kubeconfig, setKubeconfig] = useState();
  const [directory, setDirectory] = useState();
  const openDirectory = async (mode = 'read') => {
    // Following code is from:
    // https://web.dev/patterns/files/open-a-directory#progressive_enhancement
    // It is used for selecting just a directory
    // Feature detection. The API needs to be supported
    // and the app not run in an iframe.
    const supportsFileSystemAccess =
      'showDirectoryPicker' in window &&
      (() => {
        try {
          return window.self === window.top;
        } catch {
          return false;
        }
      })();
    // If the File System Access API is supported…
    if (supportsFileSystemAccess) {
      let directoryStructure;
      try {
        // Open the directory.
        const handle = await window.showDirectoryPicker();
        // Get the directory structure.
        directoryStructure = handle;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error(err.name, err.message);
        }
      }
      return directoryStructure;
    }
    // Fallback if the File System Access API is not supported.
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;

      input.addEventListener('change', () => {
        const files = Array.from(input.files);
        resolve(files);
      });
      if ('showPicker' in HTMLInputElement.prototype) {
        input.showPicker();
      } else {
        input.click();
      }
    });
  };

  const inputElement = document.getElementById("kube-config");
  function handleFiles(e) {
    setKubeconfig(e.target.files[0].name);
  }

  return (
    <div>
      <div className="content">
        <div>
          <h2>Please select your local files: </h2>
        </div>
        <div className="file">
          <label className="testi" htmlFor="kube-config">
            {kubeconfig
              ? `Selected file: ${kubeconfig}`
              : 'Choose a kubeconfig file...'}
            <input
              type="file"
              name="kube-config"
              id="kube-config"
              accept=".yaml,.yml"
              className="visually-hidden"
              onChange={handleFiles}
            />
          </label>
        </div>
        <div className="file">
          <button
            type="button"
            onClick={async () => {
              const directoryHandle = await openDirectory();
              console.log(directoryHandle);
              console.log(directoryHandle.name);
              setDirectory(directoryHandle.name);
            }}
          >
            {directory
              ? `Selected directory: ${directory}`
              : 'Choose workspace directory...'}
          </button>
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
