// src/components/trades/TradeTable.jsx
import React from "react";
import {
  formatCurrency,
  formatPercent,
  formatDate,
  formatFullDate,
} from "../../func/formatters";
import EmptyState from "../layout/EmptyState";

const TradeTable = ({ trades = [], onAdd, onEdit }) => {
  const hasRows = Array.isArray(trades) && trades.length > 0;

  return (
    <div className="table-wrapper">
      <div className="table-header">
        <h3 className="table-title">Trades</h3>

        <button
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
                <th>Pos.</th>
                <th>Price</th>
                <th>QTY</th>
                <th>Principal</th>
                <th>Exit Date</th>
                <th>Exit Price</th>
                <th>Total</th>
                <th>P/L</th>
                <th>RoI</th>
              </tr>
            </thead>

            <tbody>
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className="row"
                  onClick={() => onEdit(trade)}
                >
                  <td>{formatFullDate(trade.entry_date)}</td>

                  <td>
                    {trade.symbol} ${trade.strike_price}{" "}
                    {trade.option_type} {formatDate(trade.exp_date)}
                  </td>

                  <td className="num">{formatCurrency(trade.entry_price)}</td>
                  <td className="num">{trade.contracts}</td>

                  <td className="num">
                    {trade.principal !== null ? formatCurrency(trade.principal) : "—"}
                  </td>

                  <td>{trade.close_date ? formatFullDate(trade.close_date) : "—"}</td>

                  <td className="num">
                    {trade.exit_price ? formatCurrency(trade.exit_price) : "—"}
                  </td>

                  <td className="num">
                    {trade.total !== null ? formatCurrency(trade.total) : "—"}
                  </td>

                  <td className={`num ${trade.profit_loss >= 0 ? "positive" : "negative"}`}>
                    {trade.profit_loss !== null ? formatCurrency(trade.profit_loss) : "—"}
                  </td>

                  <td className="num">
                    {trade.roi !== null ? formatPercent(trade.roi) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty-state">
          <EmptyState
            description="Add your first trade to begin tracking performance."
            onAction={onAdd}
          />
        </div>
      )}
    </div>
  );
};

export default TradeTable;

