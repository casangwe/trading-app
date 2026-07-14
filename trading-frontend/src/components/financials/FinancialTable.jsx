// src/components/financials/FinancialTable.jsx
import React from "react";
import { formatCurrency, formatFullDate } from "../../func/formatters";
import EmptyState from "../layout/EmptyState";

const FinancialTable = ({ entries = [], onAdd, onEdit }) => {
  const hasRows = Array.isArray(entries) && entries.length > 0;

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h3 className="table-title">Financials</h3>

        <button
          type="button"
          className="table-add-btn has-tooltip"
          onClick={onAdd}
          data-tooltip="New Entry"
        >
          +
        </button>
      </div>

      <div className="divider" />

      {hasRows ? (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="num">Income</th>
                <th className="num">Expenses</th>
                <th className="num">Gains/Loss</th>
                <th className="num">Net Worth</th>
              </tr>
            </thead>

            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="row" onClick={() => onEdit?.(e)}>
                  <td>{formatFullDate(e.entry_date)}</td>
                  <td className="num">{formatCurrency(e.income ?? 0)}</td>
                  <td className="num">{formatCurrency(e.expenses ?? 0)}</td>
                  <td className={`num ${(e.gains ?? 0) >= 0 ? "positive" : "negative"}`}>
                    {formatCurrency(e.gains ?? 0)}
                  </td>
                  <td className="num">{formatCurrency(e.networth ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty-state">
          <EmptyState
            description="Add your first net worth entry to begin tracking progress."
            // actionLabel="+"
            onAction={onAdd}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialTable;
