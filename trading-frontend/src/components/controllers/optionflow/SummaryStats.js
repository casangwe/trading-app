import React from "react";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
};

const SummaryStats = ({ data }) => {
  if (!data) {
    return <p className="error-message">No data available.</p>;
  }

  return (
    <div className="summary-stats-wrapper">
      <div className="summary-stats-grid">
        <div className="stat-card">
          <p className="stat-title">Total Trades</p>
          <p className="stat-value">
            {data.overall_summary.total_trades_analyzed?.toLocaleString() ||
              "N/A"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-title">Total Contracts</p>
          <p className="stat-value">
            {data.total_contracts?.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-title">Total Calls</p>
          <p className="stat-value">
            {data.total_calls?.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-title">Total Puts</p>
          <p className="stat-value">
            {data.total_puts?.toLocaleString() || "N/A"}
          </p>
        </div>
      </div>

      <hr className="summary-divider" />

      <div className="summary-stats-grid">
        <div className="stat-card">
          <p className="stat-title">Most Active Expiry</p>
          <p className="stat-value">
            {formatDate(data.overall_summary.most_active_expiry)}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-title">Total Premium</p>
          <p className="stat-value">
            ${data.total_premium?.toLocaleString() || "N/A"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-title">Largest Trade Premium</p>
          <p className="stat-value">
            $
            {data.overall_summary.largest_trade_premium?.toLocaleString() ||
              "N/A"}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-title">Put/Call Ratio</p>
          <p className="stat-value">
            {data.put_call_ratio?.toFixed(2) || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryStats;
