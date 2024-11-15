import React, { useEffect, useState } from "react";
import {
  FaMoneyBillWave,
  FaChartLine,
  FaCashRegister,
  FaPercentage,
  FaChartPie,
} from "react-icons/fa";
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
  const [loading, setLoading] = useState(true); // eslint-disable-next-line
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

  if (loading) return <p>Loading...</p>;

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

  const roi =
    initialCash !== 0 && netPL !== 0
      ? `${calculateROI(initialCash, netPL).toFixed(2)}%`
      : "0%";

  return (
    <div className="cash-container">
      <div className="cash-card-container">
        {/* Capital Card */}
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <FaCashRegister className="card-icon" />
              <span className="label">Capital:</span>
            </div>
            <span className="value">{formatCash(initialCash)}</span>
          </div>
        </div>

        {/* Cash Card */}
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <FaChartPie className="card-icon" />
              <span className="label">Cash:</span>
            </div>
            <span className="value">{cash}</span>
          </div>
        </div>

        {/* Net P/L Card */}
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <FaChartLine className="card-icon" />
              <span className="label">P/L:</span>
            </div>
            <span className="value">{formatCash(netPL)}</span>
          </div>
        </div>

        {/* Equity Card */}
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <FaMoneyBillWave className="card-icon" />
              <span className="label">Equity:</span>
            </div>
            <span className="value">{cashBalance}</span>
          </div>
        </div>

        {/* RoI Card */}
        <div className="cash-card">
          <div className="card-content">
            <div className="icon-label">
              <FaPercentage className="card-icon" />
              <span className="label">RoI:</span>
            </div>
            <span className="value">{roi}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // return (
  //   <div className="cash-container">
  //     <div className="cash-card-container">
  //       {/* Capital Card */}
  //       <div className="cash-card">
  //         <div className="card-content">
  //           <div className="icon-label">
  //             <FaCashRegister className="card-icon" />
  //             <span className="label">Capital:</span>
  //           </div>
  //           <span className="value">{formatCash(initialCash)}</span>
  //         </div>
  //       </div>

  //       {/* Cash Card */}
  //       <div className="cash-card">
  //         <div className="card-content">
  //           <FaChartPie className="card-icon" />

  //           <span className="label">Cash:</span>
  //           <span className="value">{cash}</span>
  //         </div>
  //       </div>

  //       {/* Net P/L Card */}
  //       <div className="cash-card">
  //         <div className="card-content">
  //           <FaChartLine className="card-icon" />
  //           <span className="label">P/L:</span>
  //           <span className="value">{formatCash(netPL)}</span>
  //         </div>
  //       </div>

  //       {/* Cash Balance Card */}
  //       <div className="cash-card">
  //         <div className="card-content">
  //           <FaMoneyBillWave className="card-icon" />
  //           <span className="label">Equity:</span>
  //           <span className="value">{cashBalance}</span>
  //         </div>
  //       </div>

  //       {/* RoI Card */}
  //       <div className="cash-card">
  //         <div className="card-content">
  //           <FaPercentage className="card-icon" />
  //           <span className="label">RoI:</span>
  //           <span className="value">{roi}</span>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default Cash;
