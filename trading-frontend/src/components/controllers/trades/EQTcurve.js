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
        // Fetch cash, trades, and transactions concurrently
        const [cashData, trades, transactions] = await Promise.all([
          getCash(),
          fetchTrades(),
          fetchTransactions(),
        ]);

        if (cashData && trades && trades.length > 0 && transactions) {
          // Calculate net invested: initial cash + deposits - withdrawals
          const initialCash = parseFloat(cashData.initial_cash || 0);
          const totalDeposits = transactions
            .filter((t) => t.transaction_type === "deposit")
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          const totalWithdrawals = transactions
            .filter((t) => t.transaction_type === "withdrawal")
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
          const netInvested = initialCash + totalDeposits - totalWithdrawals;

          // Build the chart data using netInvested as the starting equity
          const formattedData = formatChartData(trades, netInvested, cashData);
          setChartData(formattedData);

          // Run additional analysis
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
          });
        } else {
          setError("No trade, cash, or transaction data available");
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
    // For the ideal curve, here we target 1.2× the starting equity
    const idealIncrement =
      trades.length > 0
        ? (startingEquity * 1.1 - startingEquity) / trades.length
        : 0;

    // Sort trades by close_date in ascending order
    const sortedTrades = trades.sort(
      (a, b) => new Date(a.close_date) - new Date(b.close_date)
    );

    // Start chart data at the cash entry_date with net invested value
    const chartData = [
      {
        date: formatDate(cashData.entry_date),
        equity: startingEquity,
        idealEquity: startingEquity,
      },
    ];

    sortedTrades.forEach((trade, index) => {
      // Update cumulative equity using the trade's profit/loss (scaling by 100 as in your code)
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
    <div className="equity-curve-chart-container">
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <div className="summary-section">
            <p className="equity-summary-total-trades">
              <span className="trade-count">
                {tradeSummary ? tradeSummary.totalTrades : "N/A"}
              </span>
              <span className="trade-label"> Trades</span>
            </p>
            <p className="equity-summary-roi">
              {tradeSummary ? `${tradeSummary.roi}%` : "ROI: N/A"}
            </p>
            <p className="equity-summary-sharpe-ratio">
              {tradeSummary
                ? `${tradeSummary.sharpeRatio}`
                : "Sharpe Ratio: N/A"}
            </p>
          </div>

          {/* Chart Section */}
          {error ? (
            <div>{error}</div>
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

// import React, { useState, useEffect } from "react";
// import { fetchTrades } from "../api/TradesAPI";
// import { getCash } from "../api/CashApi";
// import { performAnalysis } from "../analysis/AnalysisGet";
// import {
//   Line,
//   XAxis,
//   Tooltip,
//   ResponsiveContainer,
//   ComposedChart,
//   YAxis,
// } from "recharts";
// import { formatCash, formatDate } from "../func/functions";

// const EQTCurve = () => {
//   const [chartData, setChartData] = useState([]);
//   const [error, setError] = useState(null);
//   const [componentLoading, setComponentLoading] = useState(true);
//   const [tradeSummary, setTradeSummary] = useState(null);

//   useEffect(() => {
//     const fetchAndAnalyzeData = async () => {
//       try {
//         const cashData = await getCash();
//         const trades = await fetchTrades();

//         if (cashData && trades && trades.length > 0) {
//           const startingEquity = parseFloat(cashData.initial_cash || 0);
//           const formattedData = formatChartData(
//             trades,
//             startingEquity,
//             cashData
//           );
//           setChartData(formattedData);

//           const analysisResults = await performAnalysis();

//           const finalEquity = formattedData[formattedData.length - 1].equity;
//           const roi = (
//             ((finalEquity - startingEquity) / startingEquity) *
//             100
//           ).toFixed(2);

//           setTradeSummary({
//             totalTrades: analysisResults.numberOfTrades,
//             roi,
//             sharpeRatio: analysisResults.sharpeRatio.toFixed(2),
//           });
//         } else {
//           // setError("No trade or cash data available");
//         }
//       } catch (error) {
//         setError("Error fetching trade or cash data");
//         console.error("Error:", error);
//       } finally {
//         // setComponentLoading(false);
//         setTimeout(() => setComponentLoading(false), 1000);
//       }
//     };

//     fetchAndAnalyzeData();
//   }, []);

//   const formatChartData = (trades, startingEquity, cashData) => {
//     let cumulativeEquity = startingEquity;
//     const idealIncrement =
//       (startingEquity * 3 - startingEquity) / trades.length;

//     const sortedTrades = trades.sort(
//       (a, b) => new Date(a.close_date) - new Date(b.close_date)
//     );

//     const chartData = [
//       {
//         date: formatDate(cashData.entry_date),
//         equity: startingEquity,
//         idealEquity: startingEquity,
//       },
//     ];

//     sortedTrades.forEach((trade, index) => {
//       cumulativeEquity += parseFloat(trade.profit_loss || 0) * 100;
//       const idealEquity = startingEquity + idealIncrement * (index + 1);

//       chartData.push({
//         date: formatDate(trade.close_date),
//         equity: cumulativeEquity,
//         idealEquity: idealEquity,
//       });
//     });

//     return chartData;
//   };

//   return (
//     <div className="equity-curve-chart-container">
//       {/* Initial Component Loading Spinner */}
//       {componentLoading ? (
//         <div className="component-loading-spinner-wrapper">
//           <div className="spinner"></div>
//         </div>
//       ) : (
//         <>
//           {/* Summary Section for Trade Analysis */}
//           <div className="summary-section">
//             <p className="equity-summary-total-trades">
//               <span className="trade-count">
//                 {tradeSummary ? tradeSummary.totalTrades : "N/A"}
//               </span>
//               <span className="trade-label"> Trades</span>
//             </p>

//             <p className="equity-summary-roi">
//               {tradeSummary ? `${tradeSummary.roi}%` : "ROI: N/A"}
//             </p>
//             <p className="equity-summary-sharpe-ratio">
//               {tradeSummary
//                 ? `${tradeSummary.sharpeRatio}`
//                 : "Sharpe Ratio: N/A"}
//             </p>
//           </div>

//           {/* Chart Section */}
//           {error ? (
//             <div>{error}</div>
//           ) : (
//             <ResponsiveContainer width="100%" height={300}>
//               <ComposedChart data={chartData}>
//                 <XAxis dataKey="date" tick={false} axisLine={false} />
//                 <YAxis hide={true} />

//                 <Tooltip
//                   cursor={false}
//                   content={({ payload }) => {
//                     if (payload && payload.length) {
//                       const { date, equity } = payload[0].payload;
//                       return (
//                         <div className="tooltip-content">
//                           <p>{formatCash(equity)}</p>
//                           <p className="trade-date">{date}</p>
//                         </div>
//                       );
//                     }
//                     return null;
//                   }}
//                 />

//                 <Line
//                   type="monotone"
//                   dataKey="idealEquity"
//                   stroke="#dddddd"
//                   strokeWidth={2}
//                   dot={false}
//                   name="Ideal Equity"
//                 />

//                 <Line
//                   type="monotone"
//                   dataKey="equity"
//                   stroke="#4A90E2"
//                   strokeWidth={2}
//                   dot={false}
//                   name="Equity Curve"
//                 />
//               </ComposedChart>
//             </ResponsiveContainer>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default EQTCurve;
