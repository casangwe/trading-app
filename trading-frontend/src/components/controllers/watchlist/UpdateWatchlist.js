import React, { useState } from "react";
// import UpdateWatchlist from "./UpdateWatchlist";

import { formatDate, formatCash, splitText } from "../func/functions";

const UpdateWatchlist = ({ watchlist, onClose, onSave, handleDelete }) => {
  const [formData, setFormData] = useState({
    target_hit: watchlist.target_hit,
    plan: watchlist.plan,
  });
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const handleToggle = () => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      target_hit: !prevFormData.target_hit,
    }));
    setShowUpdateButton(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setShowUpdateButton(false);
    setIsEditable(false);
  };

  const toggleEdit = () => {
    setIsEditable(true);
    setShowUpdateButton(true);
  };

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{watchlist.symbol}</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="watchlist-header">
            <p className="no-id">
              N<sup>o</sup>: {`000${watchlist.id}`.slice(-5)}
            </p>
            <p className="entry-date">{formatDate(watchlist.entry_date)}</p>
          </div>
          <hr />
          <div className="upd-watch-details">
            {" "}
            <div className="watch-price">
              <div className="watch-price-icon-label">
                <span className="label">Price:</span>
              </div>
              <span className="value">${watchlist.price.toFixed(2)}</span>
            </div>
            <div className="watch-target">
              <div className="watch-target-icon-label">
                <span className="label">Target:</span>
              </div>
              <span className="value">
                ${watchlist.target_price.toFixed(2)}
              </span>
            </div>
            <div className="watch-target-hit">
              <div className="watch-target-hit-icon-label"></div>
              <label
                className="toggle-switch"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={formData.target_hit}
                  onChange={handleToggle}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          {/* Plan should be editable when the settings-icon is clicked  */}
          {/* <div className="watch-plan">
            <div className="watch-plan-icon-label"></div>
            <span className="value">{splitText(watchlist.plan)}</span>
          </div> */}
          {/* Plan should be editable when the settings-icon is clicked */}
          {/* <div className="watch-plan">
            <div className="watch-plan-icon-label"></div>
            {isEditable ? (
              <textarea
                className="editable-textarea"
                value={formData.plan}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, plan: e.target.value }))
                }
              />
            ) : (
              <span className="value">{splitText(watchlist.plan)}</span>
            )}
          </div> */}

          <div className="watch-plan">
            <div className="watch-plan-icon-label"></div>
            <div
              className="plan-container"
              ref={(el) => {
                if (el && !isEditable) {
                  el.style.height = `${el.scrollHeight}px`;
                }
              }}
            >
              {isEditable ? (
                <textarea
                  className="editable-textarea"
                  value={formData.plan}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, plan: e.target.value }))
                  }
                  style={{ height: "100%" }}
                />
              ) : (
                <span className="value">{splitText(watchlist.plan)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="icon-container">
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(watchlist.id);
              }}
              className="delete-icon"
            >
              <i className="fa-solid fa-trash"></i>
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleEdit();
              }}
              className="settings-icon"
            >
              <i className="fa-solid fa-cog"></i>
            </span>
          </div>
          {showUpdateButton && (
            <button onClick={handleSubmit} className="update-button">
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateWatchlist;
