import React, { useState } from "react";
import { formatDate, formatCash, splitText } from "../func/functions";

const UpdateWatchlist = ({ watchlist, onClose, onSave, handleDelete }) => {
  const [formData, setFormData] = useState({
    target_hit: watchlist.target_hit,
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
          <h2>{watchlist.symbol}</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="watchlist-details">
            <div className="watchlist-header">
              <p className="no-id">
                N<sup>o</sup>: {`000${watchlist.id}`.slice(-5)}
              </p>
              <p className="entry-date">{formatDate(watchlist.entry_date)}</p>
            </div>
            <hr />
            <div className="watchlist-info">
              <p>
                <strong>Price:</strong>
                <span className="watchlist-value">
                  {formatCash(watchlist.price)}
                </span>
              </p>
              <p className="target-price">
                <strong>Target Price:</strong>
                <strong className="watchlist-value">
                  {formatCash(watchlist.target_price)}
                </strong>
              </p>
              <p>
                <strong>Exp. Date:</strong>
                <span className="watchlist-value">
                  {formatDate(watchlist.exp_date)}
                </span>
              </p>
            </div>
            <hr className="small-hr" />
            <div className="plan-section">
              <p>
                <strong>Plan:</strong>{" "}
                {isEditable ? (
                  <textarea
                    value={formData.plan || watchlist.plan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plan: e.target.value,
                      })
                    }
                    className="plan-textarea"
                    rows="3"
                  />
                ) : (
                  <span className="plan-value">
                    {splitText(watchlist.plan)}
                  </span>
                )}
              </p>
            </div>
            <hr className="small-hr" />
            <div className="form-group">
              <label style={{ float: "left" }}>
                <strong>Target Hit:</strong>
              </label>
              <div className="toggle-container" style={{ float: "right" }}>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.target_hit}
                    onChange={handleToggle}
                  />
                  <span className="slider"></span>
                </label>
                {/* <span className="toggle-label">
                  {formData.target_hit ? "Yes" : "No"}
                </span> */}
              </div>
            </div>
          </div>
        </div>
        <hr className="modal-hr" />
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
