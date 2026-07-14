// src/components/Financials/FinancialEdit.jsx
import React, { useEffect, useRef, useState } from "react";
import Modal from "../layout/Modal";
import { formatCurrency, formatFullDate } from "../../func/formatters";
import {
  updateFinancial,
  deleteFinancial,
} from "../../api/financial.api";

const FinancialEdit = ({ entry, isOpen, onClose, onSaved, onDeleted }) => {
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({});

  useEffect(() => {
    if (entry && isOpen) {
      setEditing(false);
      setForm({
        entry_date: entry.entry_date,
        income: entry.income,
        nec: entry.nec,
        ffa: entry.ffa,
        play: entry.play,
        ltss: entry.ltss,
        give: entry.give,
        comments: entry.comments ?? "",
      });

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      });
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry) return null;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    await updateFinancial(entry.id, {
      entry_date: form.entry_date,
      income: Number(form.income || 0),
      nec: Number(form.nec || 0),
      ffa: Number(form.ffa || 0),
      play: Number(form.play || 0),
      ltss: Number(form.ltss || 0),
      give: Number(form.give || 0),
      comments: form.comments || null,
    });

    setEditing(false);
    if (onSaved) onSaved();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this entry?")) return;
    await deleteFinancial(entry.id);
    if (onDeleted) onDeleted();
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && editing) handleSave();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={formatFullDate(entry.entry_date)}
      onClose={onClose}
    >
      <div
        ref={containerRef}
        className="form-edit"
        tabIndex={-1}
        onKeyDown={handleKey}
      >
        {!editing ? (
          <>
            <div className="summary-row">
              <div className="metric">
                <span className="label">Net Worth</span>
                <span className="value">
                  {formatCurrency(entry.networth)}
                </span>
              </div>

              <div className="metric">
                <span className="label">Income</span>
                <span className="value">
                  {formatCurrency(entry.income)}
                </span>
              </div>
            </div>

            <div className="summary-row">
              <div className="metric">
                <span className="label">Expenses</span>
                <span className="value">
                  {formatCurrency(entry.expenses)}
                </span>
              </div>

              <div className="metric">
                <span className="label">Gains</span>
                <span className="value">
                  {formatCurrency(entry.gains)}
                </span>
              </div>
            </div>
            
            <div className="divider" />

            <div className="summary-row">
              <div className="metric full">
                <span className="label">Note</span>
                <span className="value">
                  {entry.comments || "—"}
                </span>
              </div>
            </div>

            <div className="divider" />

            <div className="edit-actions">
              <button
                className="icon-btn has-tooltip"
                data-tooltip="Edit"
                onClick={() => setEditing(true)}
              >
                ⚙
              </button>

              <button
                className="icon-btn danger has-tooltip"
                data-tooltip="Delete"
                onClick={handleDelete}
              >
                🗑
              </button>
            </div>
          </>
        ) : (
          <>
            <form className="form-edit">
              <label>Date</label>
              <input
                type="date"
                name="entry_date"
                value={form.entry_date}
                onChange={handleChange}
              />

              <label>Income</label>
              <input name="income" type="number" value={form.income} onChange={handleChange} />

              <label>NEC</label>
              <input name="nec" type="number" value={form.nec} onChange={handleChange} />

              <label>FFA</label>
              <input name="ffa" type="number" value={form.ffa} onChange={handleChange} />

              <label>PLAY</label>
              <input name="play" type="number" value={form.play} onChange={handleChange} />

              <label>LTSS</label>
              <input name="ltss" type="number" value={form.ltss} onChange={handleChange} />

              <label>GIVE</label>
              <input name="give" type="number" value={form.give} onChange={handleChange} />

              <label>Notes</label>
              <input name="comments" value={form.comments} onChange={handleChange} />
            </form>

            <div className="edit-actions">
              <button
                className="icon-btn success has-tooltip"
                data-tooltip="Save"
                onClick={handleSave}
              >
                ✔
              </button>

              <button
                className="icon-btn danger has-tooltip"
                data-tooltip="Cancel"
                onClick={() => setEditing(false)}
              >
                ✕
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default FinancialEdit;
