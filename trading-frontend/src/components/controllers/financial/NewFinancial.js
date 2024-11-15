import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFinancial } from "../api/FinancialAPI";

const NewFinancial = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    entry_date: "",
    income: "",
    NEC: "",
    FFA: "",
    PLAY: "",
    LTSS: "",
    GIVE: "",
    comments: "",
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
      const response = await createFinancial({
        ...formData,
        income: parseFloat(formData.income) || 0,
        NEC: parseFloat(formData.NEC) || 0,
        FFA: parseFloat(formData.FFA) || 0,
        PLAY: parseFloat(formData.PLAY) || 0,
        LTSS: parseFloat(formData.LTSS) || 0,
        GIVE: parseFloat(formData.GIVE) || 0,
      });

      console.log("Success:", response);
      onSuccess(response);
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting financial entry");
    }
  };

  return (
    <div className="modal">
      <div className="new-financial-container">
        <div className="header-card">
          <p className="title">Financial</p>
          <p className="close-btn" onClick={onClose}>
            &times;
          </p>
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="form-container">
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
          <label>
            <input
              type="text"
              placeholder="Income"
              name="income"
              value={formData.income}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="NEC"
              name="NEC"
              value={formData.NEC}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="FFA"
              name="FFA"
              value={formData.FFA}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="PLAY"
              name="PLAY"
              value={formData.PLAY}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="LTSS"
              name="LTSS"
              value={formData.LTSS}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="GIVE"
              name="GIVE"
              value={formData.GIVE}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
            />
          </label>
          <br />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default NewFinancial;
