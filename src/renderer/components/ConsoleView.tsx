import React, { useEffect, useState } from 'react';
import { useConsole } from '../contexts/ConsoleContext';

/**
 * A component for showing the console output
 *
 * Listens on IPC for output, and possibly for a password prompt.
 * If password is needed, the prompt is shown for the user and password is forwarded to the main process.
 * @returns {React.JSX.Element}
 */
export default function ConsoleView(): React.JSX.Element {
  const { output, setOutput, pKey, setPKey } = useConsole();
  const [showPassInput, setShowPassInput] = useState(false);
  const [labUrl, setLabUrl] = useState('');

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
    window.electronAPI.askPass((needsPassword: boolean) => {
      setShowPassInput(needsPassword);
    });
    window.electronAPI.labUrl((labUrlFromMain: string) => {
      setLabUrl(labUrlFromMain);
    });
  }
  return (
    <div>
      {/* Button for opening jupyter lab link */}
      <div className={labUrl ? 'file' : 'file hidden'}>
        {labUrl ? (
          <>
            <div className="processBtns">
              <button
                type="button"
                onClick={() => {
                  window.open(labUrl);
                }}
              >
                Open Jupyter Lab in default browser
              </button>
              <button
                className="stopBtn"
                type="button"
                onClick={() => {
                  window.electronAPI
                    .killProcess()
                    .then((msg) => {
                      console.log(msg);
                      return msg;
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }}
              >
                {' '}
                Stop process{' '}
              </button>
            </div>
            <p>{labUrl}</p>
          </>
        ) : (
          ''
        )}
      </div>
      <div className="console file">
        <p>Command output:</p>
        <div className={showPassInput ? 'output-pass' : 'output-pass hidden'}>
          {output}{' '}
          <div>
            {/* Password promt */}
            {showPassInput ? (
              // eslint-disable-next-line jsx-a11y/label-has-associated-control
              <label className="pass">
                <input type="password" />
                <button
                  type="button"
                  onClick={(event) => {
                    const clickedButton = event.target;
                    const passInput: HTMLInputElement | null = (
                      clickedButton as HTMLElement
                    ).previousElementSibling as HTMLInputElement;
                    // console.log(passInput?.value);
                    window.electronAPI?.password(
                      (passInput.value as string) || '',
                    );
                    setShowPassInput(false);
                  }}
                >
                  OK
                </button>
              </label>
            ) : (
              ''
            )}
          </div>
        </div>
        {/* Console without password prompt */}
        <div className={showPassInput ? 'output hidden' : 'output'}>
          {output}{' '}
        </div>
      </div>
    </div>
  );
}
