import React from 'react';
// import './ModalWindow.css';

function ModalWindow({ children, onClose }) {
  // const [modalIsOpen, setModalIsOpen] = useState(isOpen);

  return (
    <div className="modal">
      <div className="modal-window-content">
        {children}
        <button type="button" className="close-button" onClick={onClose}>
          X
        </button>
      </div>
    </div>
  );
}

export default ModalWindow;
