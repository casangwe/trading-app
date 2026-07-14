// src/components/portfolio/InitialCashEntry.jsx

import React, { useState } from "react";
import { createInitialCash } from "../../api/initialCash.api";

const InitialCashEntry = ({ onSuccess, onCancel }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const numericAmount = Number(amount);

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setError("Please enter a valid non-negative amount.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await createInitialCash({
        initial_cash: numericAmount,
        entry_date: date,
      });

      if (onSuccess) onSuccess(created);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to set initial cash."
      );
    } finally {
      setSubmitting(false);
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

      <label>Initial Cash</label>
      <input
        // type="number"
        step="0.01"
        min="0"
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

      <button type="submit" className="btn primary" disabled={submitting}>
        {submitting ? "Saving..." : "Set initial cash"}
      </button>

      <p
        style={{
          marginTop: "5px",
          fontSize: "0.58rem",
          lineHeight: 1.5,
          opacity: 0.7,
        }}
      >
        Please enter this carefully. This value is intended to be your one-time
        starting cash amount and may not be editable from this screen later.
      </p>
    </form>
  );
};

export default InitialCashEntry;