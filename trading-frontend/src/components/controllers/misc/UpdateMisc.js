import React, { useState } from "react";
import { formatDate, splitText } from "../func/functions";

const UpdateMisc = ({ misc, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    category: misc.category || "",
    entry_date: misc.entry_date || "",
    description: misc.description || "",
  });

  const [isEditable, setIsEditable] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: misc.id, ...formData });
    setIsEditable(false);
  };

  const toggleEdit = () => {
    setIsEditable(true);
  };

  const handleTextAreaResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="modal-container">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {misc.category.charAt(0).toUpperCase() + misc.category.slice(1)}
          </h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="misc-details">
            <div className="misc-header">
              <p className="no-id">
                N<sup>o</sup>: {`000${misc.id}`.slice(-5)}
              </p>
              <p className="entry-date">{formatDate(misc.entry_date)}</p>
            </div>
            <hr />
            <div className="misc-description">
              {isEditable ? (
                <textarea
                  className="edit-textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  onInput={handleTextAreaResize}
                  rows="15"
                  style={{ width: "98%", overflow: "hidden" }}
                />
              ) : (
                splitText(misc.description)
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <div className="icon-container">
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
          {isEditable && (
            <button onClick={handleSubmit} className="update-button">
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateMisc;
