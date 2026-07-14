// src/components/layout/EmptyState.jsx
import React from "react";

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-text">
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
      </div>

      {actionLabel && onAction && (
        <button
          className="empty-state-action"
          onClick={onAction}
          aria-label="New Entry"
        >
          <span className="empty-plus">+</span>
          <span className="empty-plus-text">New Entry</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;