// src/components/Financials/FinancialEntry.jsx

import React, { useState } from "react";
import { createFinancial } from "../../api/financial.api";

const FinancialEntry = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    entry_date: "",
    income: "",
    nec: "",
    ffa: "",
    play: "",
    ltss: "",
    give: "",
    comments: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await createFinancial({
      entry_date: form.entry_date,
      income: Number(form.income || 0),
      nec: Number(form.nec || 0),
      ffa: Number(form.ffa || 0),
      play: Number(form.play || 0),
      ltss: Number(form.ltss || 0),
      give: Number(form.give || 0),
      comments: form.comments || null,
    });

    if (onSuccess) onSuccess();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <form
      className="entry-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
    >
      <label>Date</label>
      <input
        type="date"
        name="entry_date"
        value={form.entry_date}
        onChange={handleChange}
        required
        autoFocus
      />

      <label>Income</label>
      <input name="income" type="text" onChange={handleChange} />

      <label>NEC</label>
      <input name="nec" type="text" onChange={handleChange} />

      <label>FFA</label>
      <input name="ffa" type="text" onChange={handleChange} />

      <label>PLAY</label>
      <input name="play" type="text" onChange={handleChange} />

      <label>LTSS</label>
      <input name="ltss" type="text" onChange={handleChange} />

      <label>GIVE</label>
      <input name="give" type="text" onChange={handleChange} />

      <label>Notes</label>
      <input name="comments" onChange={handleChange} />

      <button className="btn primary">Add entry</button>
    </form>
  );
};

export default FinancialEntry;
