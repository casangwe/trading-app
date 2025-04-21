import React, { useState, useEffect } from "react";
import { fetchTrades } from "../api/TradesAPI";
import { getCash } from "../api/CashApi";
import { fetchTransactions } from "../api/TransactionsAPI";
import { performAnalysis } from "../analysis/AnalysisGet";
import {
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  YAxis,
} from "recharts";
import { formatCash, formatDate } from "../func/functions";

const EQTCurve = () => {
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState(null);
  const [componentLoading, setComponentLoading] = useState(true);
  const [tradeSummary, setTradeSummary] = useState(null);

  useEffect(() => {
    const fetchAndAnalyzeData = async () => {
      try {
        const [cashData, trades, transactions] = await Promise.all([
          getCash(),
          fetchTrades(),
          fetchTransactions(),
        ]);

        if (cashData && trades && trades.length > 0 && transactions) {
          const initialCash = parseFloat(cashData.initial_cash || 0);
          const totalDeposits = transactions
            .filter((t) => t.transaction_type === "deposit")
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          const totalWithdrawals = transactions
            .filter((t) => t.transaction_type === "withdrawal")
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          const netInvested = initialCash + totalDeposits - totalWithdrawals;

          const formattedData = formatChartData(trades, netInvested, cashData);
          setChartData(formattedData);

          const analysisResults = await performAnalysis();

          const finalEquity = formattedData[formattedData.length - 1].equity;
          const roi =
            netInvested !== 0
              ? (((finalEquity - netInvested) / netInvested) * 100).toFixed(2)
              : "0";

          setTradeSummary({
            totalTrades: analysisResults.numberOfTrades,
            roi,
            sharpeRatio: analysisResults.sharpeRatio.toFixed(2),
            absoluteReturn: parseFloat(roi),
            winRate: analysisResults.winRate.toFixed(2),
          });
        } else {
          setError(
            "No historical trading data found. Please add at least one trade or deposit to see your equity curve."
          );
        }
      } catch (error) {
        setError("Error fetching trade, cash, or transaction data");
        console.error("Error:", error);
      } finally {
        setTimeout(() => setComponentLoading(false), 1000);
      }
    };

    fetchAndAnalyzeData();
  }, []);

  const formatChartData = (trades, startingEquity, cashData) => {
    let cumulativeEquity = startingEquity;
    const idealIncrement =
      trades.length > 0
        ? (startingEquity * 1.2 - startingEquity) / trades.length
        : 0;

    const sortedTrades = trades.sort(
      (a, b) => new Date(a.close_date) - new Date(b.close_date)
    );

    const chartData = [
      {
        date: formatDate(cashData.entry_date),
        equity: startingEquity,
        idealEquity: startingEquity,
      },
    ];

    sortedTrades.forEach((trade, index) => {
      cumulativeEquity += parseFloat(trade.profit_loss || 0) * 100;
      const idealEquity = startingEquity + idealIncrement * (index + 1);

      chartData.push({
        date: formatDate(trade.close_date),
        equity: cumulativeEquity,
        idealEquity: idealEquity,
      });
    });

    return chartData;
  };

  return (
    <div className="eqt-chart">
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="summary-section">
            <p className="equity-summary">
              <span className="trade-count">
                {tradeSummary ? tradeSummary.totalTrades : "N/A"}
              </span>
              <span className="trade-label"> Trades</span>
            </p>
            <p className="eqt-rate">
              {tradeSummary?.winRate != null && `${tradeSummary.winRate}%`}
            </p>
          </div>

          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData}>
                <XAxis dataKey="date" tick={false} axisLine={false} />
                <YAxis hide={true} />
                <Tooltip
                  cursor={false}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const { date, equity } = payload[0].payload;
                      return (
                        <div className="tooltip-content">
                          <p>{formatCash(equity)}</p>
                          <p className="trade-date">{date}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="idealEquity"
                  stroke="#dddddd"
                  strokeWidth={2}
                  dot={false}
                  name="Ideal Equity"
                />
                <Line
                  type="monotone"
                  dataKey="equity"
                  stroke="#4A90E2"
                  strokeWidth={2}
                  dot={false}
                  name="Equity Curve"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
};

export default EQTCurve;
