import React, { useState } from "react";
import { createTrade } from "../api/TradesAPI";

const NewTrade = ({ onClose, onNewTrade }) => {
  const [formData, setFormData] = useState({
    symbol: "",
    option_type: "CALL",
    strike_price: "",
    exp_date: "",
    entry_price: "",
    exit_price: "",
    contracts: "",
    entry_date: "",
    close_date: "",
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
      const response = await createTrade({
        ...formData,
        strike_price: parseFloat(formData.strike_price),
        entry_price: parseFloat(formData.entry_price),
        exit_price: formData.exit_price
          ? parseFloat(formData.exit_price)
          : null,
        contracts: parseInt(formData.contracts),
      });

      console.log("Success:", response);
      if (onNewTrade) {
        onNewTrade(response);
      }
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting trade");
    }
  };

  return (
    <div className="modal">
      <div className="new-trade-container">
        <div className="header-card">
          <p className="title">New Trade</p>
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
              placeholder="Symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <select
              name="option_type"
              value={formData.option_type}
              onChange={handleChange}
              required
            >
              <option value="CALL">CALL</option>
              <option value="PUT">PUT</option>
            </select>
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Strike Price"
              name="strike_price"
              value={formData.strike_price}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="date"
              placeholder="Exp. Date"
              name="exp_date"
              value={formData.exp_date}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Entry Price"
              name="entry_price"
              value={formData.entry_price}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Exit Price"
              name="exit_price"
              value={formData.exit_price}
              onChange={handleChange}
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="QTY"
              name="contracts"
              value={formData.contracts}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="date"
              placeholder="Close Date"
              name="close_date"
              value={formData.close_date}
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

export default NewTrade;
