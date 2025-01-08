import React, { useState, useEffect } from "react";
import { fetchTrades } from "../api/TradesAPI";
import { getCash } from "../api/CashApi";
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
        const cashData = await getCash();
        const trades = await fetchTrades();

        if (cashData && trades && trades.length > 0) {
          const startingEquity = parseFloat(cashData.initial_cash || 0);
          const formattedData = formatChartData(
            trades,
            startingEquity,
            cashData
          );
          setChartData(formattedData);

          const analysisResults = await performAnalysis();

          const finalEquity = formattedData[formattedData.length - 1].equity;
          const roi = (
            ((finalEquity - startingEquity) / startingEquity) *
            100
          ).toFixed(2);

          setTradeSummary({
            totalTrades: analysisResults.numberOfTrades,
            roi,
            sharpeRatio: analysisResults.sharpeRatio.toFixed(2),
          });
        } else {
          // setError("No trade or cash data available");
        }
      } catch (error) {
        setError("Error fetching trade or cash data");
        console.error("Error:", error);
      } finally {
        // setComponentLoading(false);
        setTimeout(() => setComponentLoading(false), 1000);
      }
    };

    fetchAndAnalyzeData();
  }, []);

  const formatChartData = (trades, startingEquity, cashData) => {
    let cumulativeEquity = startingEquity;
    const idealIncrement =
      (startingEquity * 3 - startingEquity) / trades.length;

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
    <div className="equity-curve-chart-container">
      {/* Initial Component Loading Spinner */}
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Summary Section for Trade Analysis */}
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
//   const [loading, setLoading] = useState(true);
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
//           setError("No trade or cash data available");
//         }
//       } catch (error) {
//         setError("Error fetching trade or cash data");
//         console.error("Error:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAndAnalyzeData();
//     setTimeout(() => setComponentLoading(false), 1000);
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
//                 {tradeSummary ? tradeSummary.totalTrades : "..."}
//               </span>
//               <span className="trade-label"> Trades</span>
//             </p>

//             <p className="equity-summary-roi">
//               {tradeSummary ? `${tradeSummary.roi}%` : "%..."}
//             </p>
//             <p className="equity-summary-sharpe-ratio">
//               {tradeSummary ? tradeSummary.sharpeRatio : "Sharpe Ratio..."}
//             </p>
//           </div>

//           {/* Data Loading Spinner */}
//           {loading ? (
//             <div className="spinner-wrapper">
//               <div className="spinner"></div>
//             </div>
//           ) : error ? (
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

// // import React, { useState, useEffect } from "react";
// // import { fetchTrades } from "../api/TradesAPI";
// // import { getCash } from "../api/CashApi";
// // import { performAnalysis } from "../analysis/AnalysisGet";
// // import {
// //   Line,
// //   XAxis,
// //   Tooltip,
// //   ResponsiveContainer,
// //   ComposedChart,
// //   YAxis,
// // } from "recharts";
// // import { formatCash, formatDate } from "../func/functions";

// // const EQTCurve = () => {
// //   const [chartData, setChartData] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [tradeSummary, setTradeSummary] = useState(null);

// //   useEffect(() => {
// //     const fetchAndAnalyzeData = async () => {
// //       try {
// //         const cashData = await getCash();
// //         const trades = await fetchTrades();

// //         if (cashData && trades && trades.length > 0) {
// //           const startingEquity = parseFloat(cashData.initial_cash || 0);
// //           const formattedData = formatChartData(
// //             trades,
// //             startingEquity,
// //             cashData
// //           );
// //           setChartData(formattedData);

// //           const analysisResults = await performAnalysis();

// //           const finalEquity = formattedData[formattedData.length - 1].equity;
// //           console.log("Starting Equity:", startingEquity);
// //           console.log("Final Equity:", finalEquity);

// //           const roi = (
// //             ((finalEquity - startingEquity) / startingEquity) *
// //             100
// //           ).toFixed(2);

// //           console.log("Calculated ROI:", roi);

// //           setTradeSummary({
// //             totalTrades: analysisResults.numberOfTrades,
// //             roi,
// //             sharpeRatio: analysisResults.sharpeRatio.toFixed(2),
// //           });
// //         } else {
// //           setError("No trade or cash data available");
// //         }
// //       } catch (error) {
// //         setError("Error fetching trade or cash data");
// //         console.error("Error:", error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchAndAnalyzeData();
// //   }, []);

// //   const formatChartData = (trades, startingEquity, cashData) => {
// //     let cumulativeEquity = startingEquity;
// //     const idealIncrement =
// //       (startingEquity * 3 - startingEquity) / trades.length;

// //     const sortedTrades = trades.sort(
// //       (a, b) => new Date(a.close_date) - new Date(b.close_date)
// //     );

// //     const chartData = [
// //       {
// //         date: formatDate(cashData.entry_date),
// //         equity: startingEquity,
// //         idealEquity: startingEquity,
// //       },
// //     ];

// //     sortedTrades.forEach((trade, index) => {
// //       cumulativeEquity += parseFloat(trade.profit_loss || 0) * 100;
// //       const idealEquity = startingEquity + idealIncrement * (index + 1);

// //       chartData.push({
// //         date: formatDate(trade.close_date),
// //         equity: cumulativeEquity,
// //         idealEquity: idealEquity,
// //       });
// //     });

// //     return chartData;
// //   };

// //   return (
// //     <div className="equity-curve-chart-container">
// //       {/* Summary Section for Trade Analysis */}
// //       <div className="summary-section">
// //         <p className="equity-summary-total-trades">
// //           <span className="trade-count">
// //             {tradeSummary ? tradeSummary.totalTrades : "..."}
// //           </span>
// //           <span className="trade-label"> Trades</span>
// //         </p>

// //         <p className="equity-summary-roi">
// //           {tradeSummary ? `${tradeSummary.roi}%` : "%..."}
// //         </p>
// //         <p className="equity-summary-sharpe-ratio">
// //           {tradeSummary ? tradeSummary.sharpeRatio : "Sharpe Ratio..."}
// //         </p>
// //       </div>

// //       {loading ? (
// //         <div>Loading...</div>
// //       ) : error ? (
// //         <div>{error}</div>
// //       ) : (
// //         <ResponsiveContainer width="100%" height={300}>
// //           <ComposedChart data={chartData}>
// //             <XAxis dataKey="date" tick={false} axisLine={false} />
// //             <YAxis hide={true} />

// //             <Tooltip
// //               cursor={false}
// //               content={({ payload }) => {
// //                 if (payload && payload.length) {
// //                   const { date, equity } = payload[0].payload;
// //                   return (
// //                     <div className="tooltip-content">
// //                       <p>{formatCash(equity)}</p>
// //                       <p className="trade-date">{date}</p>
// //                     </div>
// //                   );
// //                 }
// //                 return null;
// //               }}
// //             />

// //             <Line
// //               type="monotone"
// //               dataKey="idealEquity"
// //               stroke="#dddddd"
// //               strokeWidth={2}
// //               dot={false}
// //               name="Ideal Equity"
// //             />

// //             <Line
// //               type="monotone"
// //               dataKey="equity"
// //               stroke="#4A90E2"
// //               strokeWidth={2}
// //               dot={false}
// //               name="Equity Curve"
// //             />
// //           </ComposedChart>
// //         </ResponsiveContainer>
// //       )}
// //     </div>
// //   );
// // };

// // export default EQTCurve;
