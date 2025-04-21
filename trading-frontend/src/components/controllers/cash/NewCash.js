import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCash } from "../api/CashApi";

const NewCash = ({ onClose, onNewCash }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    entry_date: "",
    initial_cash: 0,
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
      const newCash = await createCash({
        initial_cash: parseFloat(formData.initial_cash),
        entry_date: formData.entry_date,
      });
      onNewCash(newCash);
      onClose();
      navigate("/accounts", { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Error submitting cash entry:", error);
      alert("Error submitting cash entry");
    }
  };

  return (
    <div className="modal">
      <div className="new-cash-container">
        <div className="header-card">
          <p className="title">Cash</p>
          <p className="close-btn" onClick={onClose}>
            &times;
          </p>
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="form-container">
          <label>
            <input
              type="text"
              placeholder="Initial Cash"
              name="initial_cash"
              value={formData.initial_cash}
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

export default NewCash;
