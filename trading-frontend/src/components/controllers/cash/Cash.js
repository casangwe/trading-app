import React, { useEffect, useState } from "react";
import { getCash } from "../api/CashApi";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import { fetchTransactions } from "../api/TransactionsAPI";
import {
  calculateInitialCash,
  calculateAvailableCash,
  calculateNetPL,
  calculateCashBalance,
  calculateTotalDeposits,
  calculateTotalWithdrawals,
  calculateROI,
} from "./CashCalc";
import { formatCash } from "../func/functions";

const Cash = () => {
  const [cashData, setCashData] = useState(null);
  const [dailyPnls, setDailyPnls] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cashResponse, pnlResponse, transactionsResponse] =
          await Promise.all([getCash(), fetchDailyPnls(), fetchTransactions()]);

        setCashData(cashResponse);
        setDailyPnls(pnlResponse);
        setTransactions(transactionsResponse);
      } catch (error) {
        setError(true);
        console.error("Error fetching cash data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const initialCash = cashData ? calculateInitialCash(cashData) : 0;
  const netPL = dailyPnls.length > 0 ? calculateNetPL(dailyPnls) : 0;

  const totalDeposits =
    transactions.length > 0 ? calculateTotalDeposits(transactions) : 0;
  const totalWithdrawals =
    transactions.length > 0 ? calculateTotalWithdrawals(transactions) : 0;
  const cash = formatCash(initialCash + totalDeposits - totalWithdrawals);

  const cashBalance =
    transactions.length > 0 || netPL !== 0
      ? formatCash(calculateCashBalance(initialCash, netPL, transactions))
      : formatCash(initialCash);

  const totalInvested = initialCash + totalDeposits - totalWithdrawals;

  const roi =
    totalInvested !== 0
      ? `${calculateROI(totalInvested, netPL).toFixed(2)}%`
      : "0%";

  return (
    <div className="cash-summary">
      <div className="cash-card-container">
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Principle:</span>
            </div>
            <span className="value">{formatCash(initialCash)}</span>
          </div>
        </div>

        <hr className="divider" />

        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Total Invested:</span>
            </div>
            <span className="value">{cash}</span>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Equity:</span>
            </div>
            <span className="value">{cashBalance}</span>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Net P/L:</span>
            </div>
            <span className="value">{formatCash(netPL)}</span>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">RoI:</span>
            </div>
            <span className="value">{roi}</span>
          </div>
        </div>
        <hr className="divider" />
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Deposits:</span>
            </div>
            <span className="value">{formatCash(totalDeposits)}</span>
          </div>
        </div>

        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Withdrawls:</span>
            </div>
            <span className="value">{formatCash(totalWithdrawals)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cash;
