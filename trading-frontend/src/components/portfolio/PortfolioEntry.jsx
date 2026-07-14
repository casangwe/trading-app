// src/components/portfolio/PortfolioEntry.jsx

import React, { useState } from "react";
import { createPortfolioEntry } from "../../api/portfolio.api";

const PortfolioEntry = ({ onSuccess, onCancel }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const created = await createPortfolioEntry({
        balance: Number(amount),
        entry_date: date,
      });

      onSuccess(created);
    } catch {
      setError("Failed to add balance.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (onCancel) onCancel();
    }
  };


  return (
    <form
      className="entry-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      {error && <p className="error-message">{error}</p>}

      <label>Amount</label>
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        autoFocus
      />

      <label>Date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <button type="submit" className="btn primary">
        Add balance
      </button>
    </form>
  );
};

export default PortfolioEntry;
