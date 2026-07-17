// src/components/layout/Modal.jsx

import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const Modal = ({ isOpen, title, children, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (typeof onClose === "function") onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (typeof onClose === "function") onClose();
        }
      }}
    >
      <div
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {title && <h3 className="modal-title">{title}</h3>}

        <div className="modal-content">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;

// // src/components/layout/Modal.jsx
// import React from "react";

// const Modal = ({ isOpen, title, children, onClose }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay">
//       <div className="modal-card">
//         <button className="modal-close" onClick={onClose}>
//           ×
//         </button>

//         {title && <h3 className="modal-title">{title}</h3>}

//         <div className="modal-content">{children}</div>
//       </div>
//     </div>
//   );
// };

// export default Modal;
