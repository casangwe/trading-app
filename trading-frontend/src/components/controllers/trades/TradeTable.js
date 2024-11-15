import React, { useState, useEffect } from "react";
import { fetchTrades } from "../api/TradesAPI";
import { formatDate, formatCash } from "../func/functions";
import NewTrade from "./NewTrade";

const TradeTable = ({ userId }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch trades on component mount
  useEffect(() => {
    const getTrades = async () => {
      try {
        const data = await fetchTrades();
        setTrades(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    getTrades();
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (loading) {
    return <div>Loading trades...</div>;
  }

  if (error) {
    return <div>Error fetching trades: {error}</div>;
  }

  return (
    <div className="trade-table-container">
      <div className="header-card">
        <p className="title">Trades</p>
        <div className="tooltip">
          <i
            className="btn btn-primary fa-solid fa-plus"
            id="trade-new-btn"
            onClick={handleOpenModal}
          ></i>
          <span className="tooltiptext">New Trade</span>
        </div>
      </div>
      <hr />
      <table className="trade-table">
        <thead>
          <tr>
            {/* <th>ID</th> */}
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
            <tr key={trade.id}>
              {/* <td>{trade.id}</td> */}
              <td>{formatDate(trade.entry_date)}</td>
              <td>
                {trade.symbol} ${trade.strike_price} {trade.option_type}{" "}
                {formatDate(trade.exp_date)}
              </td>
              <td>${trade.entry_price}</td>
              <td>{trade.contracts}</td>
              <td>{formatCash(trade.principal * 100)}</td>
              <td>{formatDate(trade.close_date)}</td>
              <td>${trade.exit_price}</td>
              <td>{formatCash(trade.exit_price * trade.contracts * 100)}</td>
              <td>{formatCash(trade.profit_loss * 100)}</td>
              <td>{(trade.roi * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && <NewTrade onClose={handleCloseModal} />}
    </div>
  );
};

export default TradeTable;
