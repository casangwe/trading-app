import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWatchlist } from "../api/WatchlistApi";

const NewWatchlist = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    symbol: "",
    price: "",
    target_price: "",
    target_hit: false,
    exp_date: "",
    entry_date: "",
    plan: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createWatchlist(formData);
      console.log("Success:", response);
      onClose();
      navigate("/trades", { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting watchlist");
    }
  };

  return (
    <div className="modal">
      <div className="new-watchlist-container">
        <div className="header-card">
          <p className="title">New</p>
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
            <input
              type="number"
              placeholder="Price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="number"
              placeholder="Target Price"
              name="target_price"
              value={formData.target_price}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <select
              name="target_hit"
              value={formData.target_hit ? "Yes" : "No"}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "target_hit",
                    value: e.target.value === "Yes",
                  },
                })
              }
              required
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
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
              placeholder="Plan"
              name="plan"
              value={formData.plan}
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

export default NewWatchlist;
