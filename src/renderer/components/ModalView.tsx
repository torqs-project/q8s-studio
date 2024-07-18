import { ReactNode } from 'react';
import xIcon from '../../../assets/icons/closeX.svg';
// import './ModalWindow.css';

interface ModalWindowProps {
  children: ReactNode;
  onClose: () => void;
}
function ModalWindow({ children, onClose }: ModalWindowProps) {
  return (
    <div className="modal">
      <div className="modal-window-content">
        {children}
        <button type="button" className="close-button" onClick={onClose}>
          <img src={xIcon} alt="" />
        </button>
      </div>
    </div>
  );
}
export default ModalWindow;
