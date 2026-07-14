// src/components/portfolio/PortfolioEdit.jsx


import React, { useEffect, useState, useRef } from "react";
import Modal from "../layout/Modal";
import { formatCurrency, formatPercent } from "../../func/formatters";
import {
  updatePortfolioEntry,
  deletePortfolioEntry,
} from "../../api/portfolio.api";

const PortfolioEdit = ({
  summary,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}) => {
  const [editing, setEditing] = useState(false);
  const [balance, setBalance] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (summary && isOpen) {
      setBalance(summary.close);
      setEditing(false);

      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.focus();
        }
      });
    }
  }, [summary, isOpen]);


  if (!isOpen || !summary) return null;

  const handleSave = async () => {
    await updatePortfolioEntry(summary.id, {
      balance: Number(balance),
    });

    setEditing(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this portfolio entry?")) return;
    await deletePortfolioEntry(summary.id);
    onDeleted();
  };

  const handleKey = (e) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && editing) handleSave();
  };

  return (
    <Modal isOpen={isOpen} title={summary.date} onClose={onClose}>
      <div
        ref={containerRef}
        className="form-edit"
        tabIndex={-1}
        onKeyDown={handleKey}
      >
        {/* Row 1 */}
        <div className="summary-row">
          <div className="metric">
            <span className="label">Open</span>
            <span className="value">{formatCurrency(summary.open)}</span>
          </div>

          <div className="metric">
            <span className="label">
              {editing ? "Balance" : "Close"}
            </span>

            {editing ? (
              <input
                type="text"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="input"
                autoFocus
              />
            ) : (
              <span className="value">
                {formatCurrency(summary.close)}
              </span>
            )}
          </div>
        </div>

        <div className="divider" />

        {/* Row 2 */}
        <div className="summary-row">
          <div className="metric">
            <span className="label">PNL</span>
            <span className="value">{formatCurrency(summary.pnl)}</span>
          </div>

          <div className="metric">
            <span className="label">ROI</span>
            <span className="value">{formatPercent(summary.roi)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="edit-actions">
          {!editing ? (
            <>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PortfolioEdit;