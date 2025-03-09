import React, { useState, useEffect } from "react";
import { fetchTrades } from "../api/TradesAPI";
import { formatCash, formatDate } from "../func/functions";
// import NewTrade from "./NewTrade";

const MiniTradeTable = ({ userId }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // eslint-disable-next-line
  const [showModal, setShowModal] = useState(false);

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

  return (
    <div className="trade-table-container">
      <div className="header-card">
        <p className="title">Trades</p>
        {/* <i
          className="btn btn-primary fa-solid fa-plus"
          id="trade-new-btn"
          onClick={handleOpenModal}
        ></i> */}
      </div>
      <hr />
      <table className="trade-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Pos.</th>
            <th>Price</th>
            <th>Exit Price</th>
            <th>P/L</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{formatDate(trade.entry_date)}</td>
              <td>
                {trade.symbol} ${trade.strike_price} {trade.option_type}
              </td>
              <td>${trade.entry_price}</td>
              <td>${trade.exit_price}</td>
              <td>{formatCash(trade.profit_loss * 100)}</td>
              <td>{(trade.roi * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* {showModal && <NewTrade onClose={handleCloseModal} />} */}
    </div>
  );
};

export default MiniTradeTable;
