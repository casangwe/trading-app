import React, { useState, useEffect } from "react";
import { fetchTrades } from "../api/TradesAPI";
import { formatDate, formatCash } from "../func/functions";
import NewTrade from "./NewTrade";

const TradeTable = ({ onNewTrade }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true); // Controls the initial component spinner
  const [fadeInTable, setFadeInTable] = useState(false); // Controls fade-in for table content

  const fetchTradeData = () => {
    setLoading(true);
    setError(null);
    setFadeInTable(false);

    setTimeout(async () => {
      try {
        const data = await fetchTrades();
        setTrades(data);
      } catch (err) {
        setError("Error fetching trades");
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => setFadeInTable(true), 1000);
      }
    }, 1000);
  };

  useEffect(() => {
    setTimeout(() => {
      setComponentLoading(false);
    }, 1500);
    fetchTradeData();
  }, []);

  const handleNewTradeEntry = async (newTrade) => {
    setShowModal(false);
    if (onNewTrade) onNewTrade(newTrade);

    setTrades([]);
    setLoading(true);
    setFadeInTable(false);

    await fetchTradeData();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="trade-table-wrapper">
      {componentLoading && (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      {/* Fade-in the trade-table-container only after componentLoading */}
      <div
        className={`trade-table-container ${
          !componentLoading ? "fade-in" : "loading"
        }`}
      >
        {!componentLoading && (
          <>
            {loading && (
              <div className="spinner-wrapper">
                <div className="spinner"></div>
              </div>
            )}

            {!loading && error ? (
              <p>{error}</p>
            ) : (
              <>
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
                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  <table className="trade-table">
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
                        <tr key={trade.id}>
                          <td>{formatDate(trade.entry_date)}</td>
                          <td>
                            {trade.symbol} ${trade.strike_price}{" "}
                            {trade.option_type} {formatDate(trade.exp_date)}
                          </td>
                          <td>${trade.entry_price}</td>
                          <td>{trade.contracts}</td>
                          <td>{formatCash(trade.principal * 100)}</td>
                          <td>{formatDate(trade.close_date)}</td>
                          <td>${trade.exit_price}</td>
                          <td>
                            {formatCash(
                              trade.exit_price * trade.contracts * 100
                            )}
                          </td>
                          <td>{formatCash(trade.profit_loss * 100)}</td>
                          <td>{(trade.roi * 100).toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showModal && (
                  <NewTrade
                    onClose={handleCloseModal}
                    onNewTrade={handleNewTradeEntry}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TradeTable;
