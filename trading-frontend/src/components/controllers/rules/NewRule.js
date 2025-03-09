import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRule } from "../api/RulesAPI";

const NewRule = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    entry_date: "",
    rule: "",
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
      const response = await createRule(formData);
      onClose();
      navigate("/accounts", { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Error creating rule:", error);
      alert("Error submitting rule");
    }
  };

  return (
    <div className="modal">
      <div className="new-rule-container">
        <div className="header-card">
          <p className="title">New Rule</p>
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
          <label>
            <textarea
              placeholder="Rule Description"
              name="rule"
              value={formData.rule}
              onChange={handleChange}
              required
              rows="4"
            />
          </label>
          <button type="submit">Add Rule</button>
        </form>
      </div>
    </div>
  );
};

export default NewRule;
