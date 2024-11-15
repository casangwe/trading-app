import React, { useState } from "react";
import { formatDate, splitText } from "../func/functions";

const UpdateRule = ({ rule, onClose, onSave, handleDelete }) => {
  const [formData, setFormData] = useState({
    entry_date: rule.entry_date,
    rule: rule.rule,
  });

  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
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
          <p className="no-id">
            N<sup>o</sup>: {`000${rule.id}`.slice(-5)}
          </p>{" "}
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="rule-details">
            <hr />
            <div className="rule-info">
              <label>
                {isEditable ? (
                  <textarea
                    name="rule"
                    value={formData.rule}
                    onChange={handleChange}
                    className="rule-textarea"
                    rows="10"
                    placeholder="Edit your rule here"
                  />
                ) : (
                  <span className="rule-value">{splitText(rule.rule)}</span>
                )}
              </label>
            </div>
            <hr className="small-hr" />
            <div className="form-group">
              <label>
                {isEditable ? (
                  <input
                    type="date"
                    name="entry_date"
                    value={formData.entry_date}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <span>{formatDate(formData.entry_date)}</span>
                )}
              </label>
            </div>
          </div>
        </div>
        <hr className="modal-hr" />
        <div className="modal-footer">
          <div className="icon-container">
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(rule.id);
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

export default UpdateRule;
