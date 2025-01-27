import React, { useState } from "react";
import { createDailyPnl } from "../api/DailyPNLApi";

const NewDailyPNL = ({ onClose, onNewPNL }) => {
  const [formData, setFormData] = useState({
    entry_date: "",
    open_cash: "",
    close_cash: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting Data:", formData);
      const response = await createDailyPnl(formData);
      console.log("Success:", response);
      if (onNewPNL) {
        onNewPNL(response);
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting Daily P/L entry");
    }
  };

  return (
    <div className="modal">
      <div className="new-daily-pnl-container">
        <div className="header-card">
          <p className="title">P/L</p>
          <p className="close-btn" onClick={onClose}>
            &times;
          </p>
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="form-container">
          <label>
            <input
              type="text"
              placeholder="Opening Cash"
              name="open_cash"
              value={formData.open_cash}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Closing Cash"
              name="close_cash"
              value={formData.close_cash}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="date"
              placeholder="Entry Date"
              name="entry_date"
              value={formData.entry_date}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default NewDailyPNL;
