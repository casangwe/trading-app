// src/components/transactions/TransactionEdit.jsx

import React, { useEffect, useRef, useState } from "react";
import Modal from "../layout/Modal";
import {
  formatCurrency,
  formatFullDate,
} from "../../func/formatters";
import {
  updateTransaction,
  deleteTransaction,
} from "../../api/transactions.api";

const TransactionEdit = ({
  transaction,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const containerRef = useRef(null);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    transaction_type: "",
    transaction_date: "",
    amount: "",
    transaction_summary: "",
  });

  useEffect(() => {
    if (transaction && isOpen) {
      setEditing(false);
      setForm({
        transaction_type: transaction.transaction_type,
        transaction_date: transaction.transaction_date,
        amount: transaction.amount,
        transaction_summary: transaction.transaction_summary ?? "",
      });

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      });
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    await updateTransaction(transaction.id, {
      transaction_type: form.transaction_type,
      transaction_date: form.transaction_date,
      amount: Number(form.amount),
      transaction_summary: form.transaction_summary || null,
    });

    setEditing(false);
    if (onSaved) onSaved();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this transaction?")) return;
    await deleteTransaction(transaction.id);
    if (onDeleted) onDeleted();
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && editing) handleSave();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={
        transaction.transaction_type === "deposit"
          ? "Deposit"
          : "Withdrawal"
      }
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
            {/* Date + Amount */}
            <div className="summary-row">
              <div className="metric">
                <span className="label">Date</span>
                <span className="value">
                  {formatFullDate(transaction.transaction_date)}
                </span>
              </div>

              <div className="metric">
                <span className="label">Amount</span>
                <span
                  className={`value ${
                    transaction.transaction_type === "deposit"
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {transaction.transaction_type === "withdrawal" ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>

            <div className="divider" />

            {/* Summary / Note */}
            <div className="summary-row">
              <div className="metric full">
                <span className="label">Note</span>
                <span className="value">
                  {transaction.transaction_summary || "—"}
                </span>
              </div>
            </div>

            <div className="divider" />

            {/* Actions */}
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

            {/* EDIT FORM */}
            <label>Date</label>
            <input
              type="date"
              name="transaction_date"
              value={form.transaction_date}
              onChange={handleChange}
            />

            <label>Amount</label>
            <input
              type="text"
              name="amount"
              value={form.amount}
              onChange={handleChange}
            />

            <label>Summary</label>
            <input
              name="transaction_summary"
              value={form.transaction_summary}
              onChange={handleChange}
            />

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

export default TransactionEdit;
