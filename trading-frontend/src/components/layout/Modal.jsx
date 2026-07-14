// src/components/layout/Modal.jsx
import React from "react";

const Modal = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {title && <h3 className="modal-title">{title}</h3>}

        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
