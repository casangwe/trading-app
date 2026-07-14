//src/components/trades/TradeEdit.jsx

import React, { useEffect, useRef, useState } from "react";
import Modal from "../layout/Modal";
import {
  formatCurrency,
  formatPercent,
  formatDate,
} from "../../func/formatters";
import { updateTrade, deleteTrade } from "../../api/trades.api";

const TradeEdit = ({ trade, isOpen, onClose, onSaved, onDeleted }) => {
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    strike_price: "",
    exp_date: "",
    entry_price: "",
    exit_price: "",
    contracts: "",
    close_date: "",
  });

  useEffect(() => {
    if (trade && isOpen) {
      setEditing(false);
      setForm({
        strike_price: trade.strike_price ?? "",
        exp_date: trade.exp_date ?? "",
        entry_price: trade.entry_price ?? "",
        exit_price: trade.exit_price ?? "",
        contracts: trade.contracts ?? "",
        close_date: trade.close_date ?? "",
      });

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      });
    }
  }, [trade, isOpen]);

  if (!isOpen || !trade) return null;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    await updateTrade(trade.id, {
      strike_price: Number(form.strike_price),
      exp_date: form.exp_date,
      entry_price: Number(form.entry_price),
      exit_price: form.exit_price === "" ? null : Number(form.exit_price),
      contracts: Number(form.contracts),
      close_date: form.close_date || null,
    });

    setEditing(false);
    if (onSaved) onSaved();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this trade?")) return;
    await deleteTrade(trade.id);
    if (onDeleted) onDeleted();
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && editing) handleSave();
  };

  return (
    <Modal isOpen={isOpen} title={trade.symbol} onClose={onClose}>
      <div
        ref={containerRef}
        className="form-edit"
        tabIndex={-1}
        onKeyDown={handleKey}
      >
        {!editing ? (
          <>
            {/* Position */}
            <div className="summary-row">
              <div className="metric">
                <span className="label">Position</span>
                <span className="value">
                  {trade.symbol} ${trade.strike_price}{" "}
                  {trade.option_type} {formatDate(trade.exp_date)}
                </span>
              </div>

              <div className="metric">
                <span className="label">Contracts</span>
                <span className="value">{trade.contracts}</span>
              </div>
            </div>

            <div className="divider" />

            {/* Prices */}
            <div className="summary-row">
              <div className="metric">
                <span className="label">Entry</span>
                <span className="value">
                  {formatCurrency(trade.entry_price)}
                </span>
              </div>

              <div className="metric">
                <span className="label">Exit</span>
                <span className="value">
                  {trade.exit_price
                    ? formatCurrency(trade.exit_price)
                    : "—"}
                </span>
              </div>
            </div>

            {/* Performance */}
            <div className="summary-row">
              <div className="metric">
                <span className="label">P/L</span>
                <span className="value">
                  {trade.profit_loss !== null
                    ? formatCurrency(trade.profit_loss)
                    : "—"}
                </span>
              </div>

              <div className="metric">
                <span className="label">ROI</span>
                <span className="value">
                  {trade.roi !== null ? formatPercent(trade.roi) : "—"}
                </span>
              </div>
            </div>

            {/* Capital */}
            <div className="summary-row">
              <div className="metric">
                <span className="label">Principal</span>
                <span className="value">
                  {trade.principal !== null
                    ? formatCurrency(trade.principal)
                    : "—"}
                </span>
              </div>

              <div className="metric">
                <span className="label">Total</span>
                <span className="value">
                  {trade.total !== null
                    ? formatCurrency(trade.total)
                    : "—"}
                </span>
              </div>
            </div>

            <div className="divider" />

            {/* Actions */}
            <div className="edit-actions">
              <button 
                className="icon-btn has-tooltip" 
                data-tooltip="Edit"
                onClick={() => setEditing(true)}>
                ⚙
              </button>
              <button 
                className="icon-btn danger has-tooltip" 
                data-tooltip="Delete"
                onClick={handleDelete}>
                🗑
              </button>
            </div>
          </>
        ) : (
          <>
            {/* EDIT FORM — mirrors TradeEntryForm */}

            <label>Strike</label>
            <input
              name="strike_price"
              type="text"
              value={form.strike_price}
              onChange={handleChange}
              autoFocus
            />

            <label>Expiration</label>
            <input
              name="exp_date"
              type="date"
              value={form.exp_date}
              onChange={handleChange}
            />

            <label>Entry Price</label>
            <input
              name="entry_price"
              type="text"
              value={form.entry_price}
              onChange={handleChange}
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
            />

            <label>Close Date</label>
            <input
              name="close_date"
              type="date"
              value={form.close_date}
              onChange={handleChange}
            />

            <div className="edit-actions">
              <button 
                className="icon-btn success has-tooltip" 
                data-tooltip="Save"
                onClick={handleSave}>
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

export default TradeEdit;
