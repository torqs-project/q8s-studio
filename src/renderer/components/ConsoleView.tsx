import React, { useEffect, useState } from 'react';
import { useAppNavigation, useConsole } from '../contexts/ConsoleContext';
import xmarkSolid from '../../../assets/icons/stop.svg';

/**
 * A component for showing the console output
 *
 * Listens on IPC for output.
 * @returns {React.JSX.Element}
 */
export default function ConsoleView(): React.JSX.Element {
  const { output, setOutput, pKey, setPKey, labUrl, setLabUrl } = useConsole();
  const { envName } = useAppNavigation();
  const [showDownload, setShowDownload] = useState(false);

  // Add auto-scroll to the bottom of the console
  useEffect(() => {
    const consoleDiv = document.querySelector('.console>.output');
    consoleDiv?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    });
  }, [output]);
  // Add a listener to the channel cli-output,
  // listens to the main process for output
  if (window.electronAPI) {
    window.electronAPI.on('cli-output', (_event, data) => {
      setPKey(pKey + 1);
      const newline: React.JSX.Element = <p key={pKey}>{data}</p>;
      setOutput([...output, newline]);
    });
    window.electronAPI.labUrl((labUrlFromMain: string) => {
      setLabUrl(labUrlFromMain);
    });
    window.electronAPI.imageExists((imageExists: boolean) => {
      setShowDownload(!imageExists);
      console.log(showDownload);
    });
  }
  return (
    <div>
      {/* Button for opening jupyter lab link */}
      <div className="file">
        <div className="processBtns">
          {showDownload ? (
            <>
              <button type="button" className="showDownloadBtn">
                Downloading environment...
              </button>
              <button
                className="stopBtn"
                type="button"
                onClick={() => {
                  window.electronAPI
                    .killProcess(envName)
                    .then((msg) => {
                      setLabUrl('');
                      setShowDownload(false);
                      return msg;
                    })
                    .catch((err) => {
                      return err;
                    });
                }}
              >
                <img src={xmarkSolid} alt="stop" /> Stop download
              </button>
            </>
          ) : (
            ''
          )}
        </div>
        <div className="processBtns">
          {/* {console.log(labUrl)} */}
          {labUrl ? (
            <>
              <button
                type="button"
                onClick={() => {
                  console.log('onclick');
                  console.log(labUrl);

                  window.open(new URL(labUrl));
                }}
              >
                Open Jupyter Lab in default browser
              </button>
              <button
                className="stopBtn"
                type="button"
                onClick={() => {
                  window.electronAPI
                    .killProcess(envName)
                    .then((msg) => {
                      setLabUrl('');
                      return msg;
                    })
                    .catch((err) => {
                      return err;
                    });
                }}
              >
                <img src={xmarkSolid} alt="stop" /> Stop environment
              </button>
            </>
          ) : (
            // ''
            <p className="infoP">No running Jupyter instance</p>
          )}
        </div>
        <p>{labUrl}</p>
      </div>
      <div className="console file">
        <div className="console-header">
          {envName ? (
            <p>Current environment: {envName}</p>
          ) : (
            <p>No environment selected</p>
          )}
          <button
            className="clearBtn"
            type="button"
            onClick={() => {
              setOutput([]);
            }}
          >
            Clear output
          </button>
        </div>
        {/* Console output */}
        <div className="output">{output} </div>
      </div>
    </div>
  );
}
