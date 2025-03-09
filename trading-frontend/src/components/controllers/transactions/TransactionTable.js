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
  const [componentLoading, setComponentLoading] = useState(true);
  const [fadeInTable, setFadeInTable] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setComponentLoading(false);
    }, 1500);
    getTransactionsTradesAndCash();
  }, []);

  const getTransactionsTradesAndCash = async () => {
    setLoading(true);
    setError(null);
    setFadeInTable(false);

    setTimeout(async () => {
      try {
        const transactionsData = await fetchTransactions();
        const tradesData = await fetchTrades();
        const cashData = await getCash();

        const initialCashEntry = {
          id: `cash-${cashData.id}`,
          transaction_date: cashData.entry_date,
          transaction_type: "Initial Cash",
          amount: parseFloat(cashData.initial_cash),
          transaction_summary: `Initial cash of ${formatCash(
            parseFloat(cashData.initial_cash)
          )}`,
          isInitialCash: true,
        };

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
            isInitialCash: false,
          };
        });

        const allData = [
          ...transactionsData,
          ...formattedTrades,
          initialCashEntry,
        ].sort((a, b) => {
          const dateComparison =
            new Date(b.transaction_date) - new Date(a.transaction_date);
          if (dateComparison !== 0) return dateComparison;
          return a.isInitialCash ? 1 : -1;
        });

        setTransactions(allData);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
        setTimeout(() => setFadeInTable(true), 1000);
      }
    }, 1000);
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="transaction-table-wrapper">
      {componentLoading && (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      <div
        className={`transaction-table-container ${
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
              <p>Error fetching transactions: {error}</p>
            ) : (
              <>
                <div className="header-card">
                  <p className="title">Transactions</p>

                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="transaction-new-btn"
                      onClick={handleOpenModal}
                    ></i>
                    <span className="tooltiptext">New Txn.</span>
                  </div>
                </div>
                <hr />

                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
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
                </div>

                {showModal && <NewTransaction onClose={handleCloseModal} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
