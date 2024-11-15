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
  calculateROI,
} from "../cash/CashCalc";

const InvestmentChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [investmentSummary, setInvestmentSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

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

          setChartData(formatChartData(sortedData, cashData));
          setInvestmentSummary(
            calculateInvestmentSummary(
              sortedData,
              cashData,
              transactionsResponse
            ) // Pass transactions
          );
        } else {
          setError("No daily PNL, cash, or transaction data available");
        }
      } catch (error) {
        setError("Error fetching data");
        console.error("Error fetching daily PNL data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestmentData();
  }, []);

  const calculateInvestmentSummary = (dailyPnls, cashData, transactions) => {
    const initialCash = calculateInitialCash(cashData);
    const netPL = calculateNetPL(dailyPnls);
    const cashBalance = calculateCashBalance(initialCash, netPL, transactions);
    const roi = calculateROI(initialCash, netPL);

    const latestDate = formatDate(
      dailyPnls.length > 0 ? dailyPnls[dailyPnls.length - 1]?.entry_date : null
    );

    return {
      balance: cashBalance,
      roi: roi,
      latestDate: latestDate,
      pnl: netPL,
    };
  };

  const formatChartData = (data, cashData) => {
    const initialEntry = {
      date: formatDate(cashData.entry_date),
      closingBalance: parseFloat(cashData.initial_cash || 0),
    };

    const formattedData = data.map((entry) => ({
      date: formatDate(entry.entry_date),
      closingBalance: parseFloat(entry.close_cash || 0),
    }));

    return [initialEntry, ...formattedData];
  };

  return (
    <div className="investment-chart-container">
      <div className="summary-section">
        <p className="investment-cash">
          {formatCash(investmentSummary?.balance || 0)}
        </p>
        <p className="investment-roi">
          {investmentSummary
            ? `${formatCash(
                investmentSummary.pnl || 0
              )} (${investmentSummary.roi.toFixed(2)}%)`
            : "Loading..."}
        </p>
        <p className="investment-date">
          {investmentSummary?.latestDate || "Loading..."}
        </p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
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
    </div>
  );
};

export default InvestmentChart;
