import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createDailyPnl, updateDailyPnl } from "../api/DailyPNLApi";

const NewDailyPNL = ({ onClose, onNewDailyPNL, existingData }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    entry_date: existingData?.entry_date || "",
    open_cash: existingData?.open_cash || "",
    close_cash: existingData?.close_cash || "",
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        entry_date: existingData.entry_date,
        open_cash: existingData.open_cash,
        close_cash: existingData.close_cash,
      });
    }
  }, [existingData]);

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
      let response;
      if (existingData) {
        response = await updateDailyPnl(existingData.id, {
          entry_date: formData.entry_date,
          open_cash: parseFloat(formData.open_cash),
          close_cash: parseFloat(formData.close_cash),
        });
      } else {
        response = await createDailyPnl({
          entry_date: formData.entry_date,
          open_cash: parseFloat(formData.open_cash),
          close_cash: parseFloat(formData.close_cash),
        });
      }
      onNewDailyPNL(response);
      onClose();
      navigate("/", { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Error submitting Daily PNL entry:", error);
      alert("Error submitting Daily PNL entry");
    }
  };

  return (
    <div className="modal">
      <div className="new-daily-pnl-container">
        <div className="header-card">
          <p className="title">{existingData ? "Update P/L" : "P/L"}</p>
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
          <button type="submit">{existingData ? "Update" : "Add"}</button>
        </form>
      </div>
    </div>
  );
};

export default NewDailyPNL;
