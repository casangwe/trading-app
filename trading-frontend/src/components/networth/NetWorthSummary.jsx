// src/components/networth/NetWorthSummary.jsx
import React, { useMemo } from "react";
import { formatCurrency, formatPercent, formatFullDate } from "../../func/formatters";

const NetWorthSummary = ({ entries = [], onAdd, onEdit }) => {
  const summary = useMemo(() => {
    if (!entries || entries.length === 0) {
      return {
        initial: 0,
        previous: 0,
        current: 0,
        difference: 0,
        percent: 0,
        date: null,
        initialEntry: null,
        previousEntry: null,
        currentEntry: null,
      };
    }

    const sorted = [...entries].sort(
      (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
    );

    const firstEntry = sorted[0] || null;
    const lastEntry = sorted[sorted.length - 1] || null;
    const prevEntry = sorted.length > 1 ? sorted[sorted.length - 2] : firstEntry;

    const initial = Number(firstEntry?.networth || 0);
    const current = Number(lastEntry?.networth || 0);
    const previous = Number(prevEntry?.networth || 0);

    const difference = current - previous;
    const percent = previous !== 0 ? (difference / previous) * 100 : 0;

    return {
      initial,
      previous,
      current,
      difference,
      percent,
      date: lastEntry?.entry_date ? formatFullDate(lastEntry.entry_date) : null,
      initialEntry: firstEntry,
      previousEntry: prevEntry,
      currentEntry: lastEntry,
    };
  }, [entries]);

  return (
    <div className="portfolio-summary networth-summary">
      <button
        className="portfolio-summary-add has-tooltip"
        onClick={onAdd}
        data-tooltip="New Entry"
      >
        +
      </button>

      <div className="summary-row">
        <div
          className="metric"
          onClick={() => (summary.initialEntry ? onEdit(summary.initialEntry) : onAdd())}
        >
          <span className="label">Initial Net Worth</span>
          <span className="value">{formatCurrency(summary.initial)}</span>
        </div>

        <div
          className="metric"
          onClick={() => (summary.currentEntry ? onEdit(summary.currentEntry) : onAdd())}
        >
          <span className="label">Current</span>
          <span className="value">{formatCurrency(summary.current)}</span>
        </div>
      </div>

      <div className="divider" />

      <div className="summary-row">
        <div
          className="metric"
          onClick={() => (summary.previousEntry ? onEdit(summary.previousEntry) : onAdd())}
        >
          <span className="label">Previous</span>
          <span className="value">{formatCurrency(summary.previous)}</span>
        </div>

        <div
          className="metric"
          onClick={() => (summary.currentEntry ? onEdit(summary.currentEntry) : onAdd())}
        >
          <span className="label">Change (%)</span>
          <span className="value">
            {formatCurrency(summary.difference)} ({formatPercent(summary.percent)})
          </span>
        </div>
      </div>

      {summary.date && <div className="summary-date">{summary.date}</div>}
    </div>
  );
};

export default NetWorthSummary;

