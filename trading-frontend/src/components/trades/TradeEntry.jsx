// src/components/trades/TradeEntry.jsx

import React, { useState } from "react";
import { createTrade } from "../../api/trades.api";

const TradeEntry = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    symbol: "",
    option_type: "CALL",
    strike_price: "",
    exp_date: "",
    entry_price: "",
    exit_price: "",
    contracts: 1,
    entry_date: "",
    close_date: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createTrade({
      symbol: form.symbol.toUpperCase(),
      option_type: form.option_type,
      strike_price: Number(form.strike_price),
      exp_date: form.exp_date,
      entry_price: Number(form.entry_price),
      exit_price: form.exit_price ? Number(form.exit_price) : null,
      contracts: Number(form.contracts),
      entry_date: form.entry_date,
      close_date: form.close_date || null,
    });

    onSuccess();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      }
    }
  };


  return (
    <form
      className="entry-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <label>Option Type</label>
      <div className="option-toggle">
        <button
          type="button"
          className={`option-btn ${
            form.option_type === "CALL" ? "active" : ""
          }`}
          onClick={() =>
            setForm((prev) => ({ ...prev, option_type: "CALL" }))
          }
        >
          CALL
        </button>

        <div className="option-divider" />

        <button
          type="button"
          className={`option-btn ${
            form.option_type === "PUT" ? "active" : ""
          }`}
          onClick={() =>
            setForm((prev) => ({ ...prev, option_type: "PUT" }))
          }
        >
          PUT
        </button>
      </div>

      <label>Entry Date</label>
      <input
        name="entry_date"
        type="date"
        value={form.entry_date}
        onChange={handleChange}
        required
      />

      <label>Symbol</label>
      <input
        name="symbol"
        value={form.symbol}
        onChange={handleChange}
        required
        autoFocus
      />

      <label>Strike</label>
      <input
        name="strike_price"
        type="text"
        value={form.strike_price}
        onChange={handleChange}
        required
      />

      <label>Expiration</label>
      <input
        name="exp_date"
        type="date"
        value={form.exp_date}
        onChange={handleChange}
        required
      />

      <label>Entry Price</label>
      <input
        name="entry_price"
        type="text"
        value={form.entry_price}
        onChange={handleChange}
        required
      />

      <label>Exit Price</label>
      <input
        name="exit_price"
        type="text"
        value={form.exit_price}
        onChange={handleChange}
      />

      <label>Contracts</label>
      <input
        name="contracts"
        type="text"
        value={form.contracts}
        onChange={handleChange}
        required
      />

      <label>Close Date</label>
      <input
        name="close_date"
        type="date"
        value={form.close_date}
        onChange={handleChange}
      />

      <button className="btn primary">Add trade</button>
    </form>
  );
};

export default TradeEntry;
