import React, { useState, useEffect } from "react";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import { getCash } from "../api/CashApi";
import { fetchTransactions } from "../api/TransactionsAPI";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCash, formatDate } from "../func/functions";
import {
  calculateInitialCash,
  calculateNetPL,
  calculateCashBalance,
  calculateTotalDeposits,
  calculateTotalWithdrawals,
  calculateROI,
} from "../cash/CashCalc";
import NewCash from "../cash/NewCash";

const InvestmentChart = () => {
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [investmentSummary, setInvestmentSummary] = useState(null);
  const [componentLoading, setComponentLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [showNewCashModal, setShowNewCashModal] = useState(false);

  useEffect(() => {
    const fetchInvestmentData = async () => {
      try {
        const [dailyPnls, cashData, transactionsResponse] = await Promise.all([
          fetchDailyPnls(),
          getCash(),
          fetchTransactions(),
        ]);

        if (dailyPnls && cashData && transactionsResponse) {
          const sortedData = dailyPnls.sort(
            (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
          );

          setTransactions(transactionsResponse);

          setChartData(
            formatChartData(sortedData, cashData, transactionsResponse)
          );
          setInvestmentSummary(
            calculateInvestmentSummary(
              sortedData,
              cashData,
              transactionsResponse
            )
          );
        } else {
          setError(
            "No cash data. Please make a deposit to see your cash details."
          );
        }
      } catch (error) {
        setError("Error fetching cash data.");
        console.error("Error fetching daily PNL data:", error);
      } finally {
        setTimeout(() => setComponentLoading(false), 1000);
      }
    };

    fetchInvestmentData();
  }, []);

  const calculateInvestmentSummary = (dailyPnls, cashData, transactions) => {
    if (!dailyPnls.length || !cashData) {
      return {
        balance: 0,
        roi: 0,
        latestDate: "N/A",
        pnl: 0,
      };
    }

    const initialCash = calculateInitialCash(cashData);
    const netPL = calculateNetPL(dailyPnls);
    const cashBalance = calculateCashBalance(initialCash, netPL, transactions);
    const totalDeposits = calculateTotalDeposits(transactions);
    const totalWithdrawals = calculateTotalWithdrawals(transactions);

    const totalInvested = initialCash + totalDeposits - totalWithdrawals;

    let roi = 0;
    if (totalInvested !== 0) {
      roi = ((cashBalance - totalInvested) / totalInvested) * 100;
    }

    const latestDate = formatDate(
      dailyPnls.length > 0 ? dailyPnls[dailyPnls.length - 1]?.entry_date : null
    );

    return {
      balance: cashBalance,
      roi: roi.toFixed(2),
      latestDate: latestDate,
      pnl: netPL,
    };
  };

  const formatChartData = (dailyPnls, cashData, transactions = []) => {
    if (dailyPnls.length === 0 || !cashData) {
      return [];
    }
    const filteredPnls = dailyPnls.filter(
      (entry) => formatDate(entry.entry_date) !== "01/01"
    );

    if (filteredPnls.length === 0) {
      return [];
    }

    const initialCash = calculateInitialCash(cashData);
    const totalDeposits = calculateTotalDeposits(transactions);
    const totalWithdrawals = calculateTotalWithdrawals(transactions);

    const totalInvested = initialCash + totalDeposits - totalWithdrawals;

    let previousBalance = totalInvested;
    let formattedData = [];

    for (let i = 0; i < filteredPnls.length; i++) {
      let currentDate = filteredPnls[i].entry_date;
      let dailyPNLChange = parseFloat(filteredPnls[i].balance);

      previousBalance += dailyPNLChange;

      formattedData.push({
        date: formatDate(currentDate),
        closingBalance: previousBalance,
      });
    }

    console.log("🔥 Final Formatted Data:", formattedData);

    return formattedData;
  };

  return (
    <div className="investment-chart">
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="summary-section">
            <p className="investment-cash">
              {formatCash(investmentSummary?.balance || 0)}
            </p>
            <p className="investment-roi">
              {investmentSummary
                ? `${formatCash(investmentSummary.pnl || 0)} (${
                    investmentSummary.roi
                  }%)`
                : "N/A"}
            </p>

            <p className="investment-date">
              {investmentSummary?.latestDate || "N/A"}
            </p>
          </div>

          {error ? (
            <div className="error-section">
              <p className="error-message">{error}</p>
              <div className="header-card">
                <div className="tooltip">
                  <span className="tooltiptext">Add Cash</span>
                  <i
                    className="btn btn-primary fa-solid fa-plus"
                    id="cash-new-btn"
                    onClick={() => setShowNewCashModal(true)}
                  ></i>
                </div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} style={{ background: "transparent" }}>
                <XAxis dataKey="date" tick={false} axisLine={false} />
                <Tooltip
                  cursor={false}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const { date, closingBalance } = payload[0].payload;
                      return (
                        <div className="tooltip-content">
                          <p>{formatCash(closingBalance)}</p>
                          <p className="invest-date">{date}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="closingBalance"
                  stroke="#4a90e2"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {showNewCashModal && (
            <NewCash
              onClose={() => setShowNewCashModal(false)}
              onNewCash={() => {
                setShowNewCashModal(false);
                window.location.reload(); // or refetch the data if you want SPA behavior
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default InvestmentChart;
