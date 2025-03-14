import React from "react";

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
};

const LargestTrade = ({ trade }) => {
  if (!trade) {
    return <p className="error-message">No largest trade available.</p>;
  }

  return (
    <div className="largest-trade-wrapper">
      <h3 className="largest-trade-title">Largest Trade</h3>
      <table className="largest-trade-table">
        <tbody>
          <tr>
            <td className="trade-label">Symbol:</td>
            <td className="trade-value">{trade.symbol || "N/A"}</td>
          </tr>
          <tr>
            <td className="trade-label">Strike Price:</td>
            <td className="trade-value">
              ${trade.strike?.toLocaleString() || "N/A"}
            </td>
          </tr>
          <tr>
            <td className="trade-label">Side:</td>
            <td className="trade-value">{trade.side || "N/A"}</td>
          </tr>
          <tr>
            <td className="trade-label">Size:</td>
            <td className="trade-value">
              {trade.size?.toLocaleString() || "N/A"}
            </td>
          </tr>
          <tr>
            <td className="trade-label">Premium:</td>
            <td className="trade-value">
              ${trade.premium?.toLocaleString() || "N/A"}
            </td>
          </tr>
          <tr>
            <td className="trade-label">Volume:</td>
            <td className="trade-value">
              {trade.volume?.toLocaleString() || "N/A"}
            </td>
          </tr>
          <tr>
            <td className="trade-label">Conditions:</td>
            <td className="trade-value">{trade.conds || "N/A"}</td>
          </tr>
          <tr>
            <td className="trade-label">Expiry:</td>
            <td className="trade-value">{formatDate(trade.expiry)}</td>
          </tr>
          <tr>
            <td className="trade-label">Trade Date:</td>
            <td className="trade-value">{formatDate(trade.trade_date)}</td>
          </tr>
          <tr>
            <td className="trade-label">Trade Time:</td>
            <td className="trade-value">{trade.trade_time || "N/A"}</td>
          </tr>
          <tr>
            <td className="trade-label">Put/Call:</td>
            <td className="trade-value">{trade.put_call || "N/A"}</td>
          </tr>
          <tr>
            <td className="trade-label">Spot Price:</td>
            <td className="trade-value">
              ${trade.spot?.toLocaleString() || "N/A"}
            </td>
          </tr>
          <tr>
            <td className="trade-label">Price:</td>
            <td className="trade-value">
              ${trade.price?.toLocaleString() || "N/A"}
            </td>
          </tr>
          <tr>
            <td className="trade-label">Sweep/Block:</td>
            <td className="trade-value">{trade.sweep_block_split || "N/A"}</td>
          </tr>
          <tr>
            <td className="trade-label">Open Interest:</td>
            <td className="trade-value">
              {trade.open_int?.toLocaleString() || "N/A"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default LargestTrade;
