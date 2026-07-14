import React from "react";
import { formatCurrency, formatPercent } from "../../func/formatters";

const PortfolioSummary = ({ summary, onEdit, hideAddAction = false }) => {
  const {
    open = 0,
    close = 0,
    pnl = 0,
    roi = 0,
    date = null,
  } = summary || {};

  return (
    <div className="portfolio-summary">
      {!hideAddAction && (
        <button
          className="portfolio-summary-add has-tooltip"
          onClick={() => onEdit("add")}
          data-tooltip="New Entry"
        >
          +
        </button>
      )}

      <div className="summary-row">
        <div className="metric" onClick={() => onEdit("open")}>
          <span className="label">Open</span>
          <span className="value">{formatCurrency(open)}</span>
        </div>

        <div className="metric" onClick={() => onEdit("close")}>
          <span className="label">Close</span>
          <span className="value">{formatCurrency(close)}</span>
        </div>
      </div>

      <div className="divider" />

      <div className="summary-row">
        <div className="metric" onClick={() => onEdit("pnl")}>
          <span className="label">PNL</span>
          <span className="value">{formatCurrency(pnl)}</span>
        </div>

        <div className="metric" onClick={() => onEdit("roi")}>
          <span className="label">ROI</span>
          <span className="value">{formatPercent(roi)}</span>
        </div>
      </div>

      {date && <div className="summary-date">{date}</div>}
    </div>
  );
};

export default PortfolioSummary;

