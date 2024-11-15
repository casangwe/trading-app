import React, { useState, useEffect } from "react";
import { fetchTransactions } from "../api/TransactionsAPI";
import { fetchTrades } from "../api/TradesAPI";
import { getCash } from "../api/CashApi";
import { formatDate, formatCash } from "../func/functions";
import NewTransaction from "./NewTransaction";

const TransactionTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch transactions, trades, and initial cash on component mount
  useEffect(() => {
    const getTransactionsTradesAndCash = async () => {
      try {
        const transactionsData = await fetchTransactions();
        const tradesData = await fetchTrades();
        const cashData = await getCash();

        console.log("Fetched trades:", tradesData);
        console.log("Fetched cash:", cashData);

        // Format initial cash as a transaction entry without multiplying by 100
        const initialCashEntry = {
          id: `cash-${cashData.id}`,
          transaction_date: cashData.entry_date,
          transaction_type: "Initial Cash",
          amount: parseFloat(cashData.initial_cash),
          transaction_summary: `Initial cash of ${formatCash(
            parseFloat(cashData.initial_cash)
          )}`,
          isInitialCash: true, // Add a flag to identify initial cash entry
        };

        // Format trades to match transaction format
        const formattedTrades = tradesData.map((trade) => {
          const profitLossAmount = parseFloat(trade.profit_loss || 0) * 100;
          const profitOrLoss = profitLossAmount >= 0 ? "profit" : "loss";

          return {
            id: trade.id,
            transaction_date: trade.close_date,
            transaction_type: "Trade",
            amount: profitLossAmount,
            transaction_summary: `${trade.symbol} trade with ${formatCash(
              Math.abs(profitLossAmount)
            )} ${profitOrLoss}`,
            isInitialCash: false, // Not initial cash
          };
        });

        // Combine all entries and sort them
        const allData = [
          ...transactionsData,
          ...formattedTrades,
          initialCashEntry,
        ].sort((a, b) => {
          const dateComparison =
            new Date(b.transaction_date) - new Date(a.transaction_date);
          if (dateComparison !== 0) return dateComparison;

          // Ensure initial cash is last if on the same date as other transactions
          return a.isInitialCash ? 1 : -1;
        });

        setTransactions(allData);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    getTransactionsTradesAndCash();
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching transactions: {error}</div>;
  }

  return (
    <div className="transaction-table-container">
      <div className="header-card">
        <p className="title">Transactions</p>

        <div class="tooltip">
          <i
            className="btn btn-primary fa-solid fa-plus"
            id="transaction-new-btn"
            onClick={handleOpenModal}
          ></i>
          <span class="tooltiptext">New Txn.</span>
        </div>
      </div>
      <hr />
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{formatDate(transaction.transaction_date)}</td>
              <td>{transaction.transaction_type}</td>
              <td>{formatCash(transaction.amount)}</td>
              <td>{transaction.transaction_summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && <NewTransaction onClose={handleCloseModal} />}
    </div>
  );
};

export default TransactionTable;
