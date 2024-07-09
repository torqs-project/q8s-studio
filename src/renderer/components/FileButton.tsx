import React from 'react';

interface fileButtonProps {
  name: string;
  path: string;
  isDirectory?: boolean;
  openDialog: (isDirectory: boolean) => void;
}
/**
 * A component to display a button for selecting a file or directory.
 */
export default function FileButton({
  name,
  path,
  isDirectory = false,
  openDialog,
}: fileButtonProps) {
  const text = isDirectory
    ? 'Choose a workspace folder...'
    : 'Choose a kubernetes configuration file...';
  return (
    <div className="file">
      <button
        type="button"
        className="file-button"
        onClick={() => openDialog(isDirectory)}
      >
        {path ? `Selected ${isDirectory ? 'folder' : 'file'}: ${name}` : text}
      </button>
      <span>{path ? `Path: ${path}` : ''}</span>
    </div>
  );
}
FileButton.defaultProps = {
  isDirectory: false,
};
