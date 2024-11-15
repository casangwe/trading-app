import React, { useState, useEffect } from "react";
import { fetchTrades } from "../api/TradesAPI";

const TradeSum = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getTrades = async () => {
      try {
        const data = await fetchTrades();
        setTrades(data);
        console.log(data);
        setLoading(false);
      } catch (error) {
        setError("Error fetching trades");
        setLoading(false);
      }
    };

    getTrades();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Helper function to format dates
  const formatDate = (date) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString(undefined, options);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Weekly date (start of the week)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weeklyDate = formatDate(startOfWeek);

  // Monthly date (current month/year)
  const monthlyDate = `${today.getMonth() + 1}/${today.getFullYear()}`;

  const filterTrades = (period) => {
    if (period === "weekly") {
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return trades.filter((trade) => {
        const tradeDate = new Date(trade.entry_date);
        return tradeDate >= startOfWeek && tradeDate <= endOfWeek;
      });
    } else if (period === "monthly") {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return trades.filter((trade) => {
        const tradeDate = new Date(trade.entry_date);
        return tradeDate >= startOfMonth && tradeDate <= endOfMonth;
      });
    }
    return trades;
  };

  const renderTradeRows = (tradeList) =>
    tradeList.map((trade) => (
      <tr key={trade.id}>
        <td>
          {trade.symbol} ${trade.strike_price} {trade.option_type}
          {trade.exp_date}
        </td>
        <td>
          ${trade.entry_price} - ${trade.exit_price}
        </td>
        <td>{(trade.roi * 100).toFixed(2)}%</td>
      </tr>
    ));

  return (
    <div className="trade-summary-container">
      <div className="column weekly">
        <div className="header">
          <h3>Weekly</h3>
          <span className="date">{weeklyDate}</span>
        </div>
        <hr />
        <table className="trade-table">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Price</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>{renderTradeRows(filterTrades("weekly"))}</tbody>
        </table>
      </div>

      <div className="column monthly">
        <div className="header">
          <h3>Monthly</h3>
          <span className="date">{monthlyDate}</span>
        </div>
        <hr />
        <table className="trade-table">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Price</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>{renderTradeRows(filterTrades("monthly"))}</tbody>
        </table>
      </div>

      <div className="column all-trades">
        <h3>All Trades</h3>
        <hr />
        <table className="trade-table">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Price</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>{renderTradeRows(trades)}</tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeSum;
