import React, { useState, useEffect } from "react";
import { fetchFinancials } from "../api/FinancialAPI";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatDate, formatCash } from "../func/functions";

const IncomeExpensesComparisonChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({
    income: null,
    expenses: null,
    date: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const financials = await fetchFinancials();
        const sortedData = financials.sort(
          (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
        );

        setChartData(formatChartData(sortedData));
        setSummary(calculateSummary(sortedData));
      } catch (error) {
        setError("Error fetching financial data");
        console.error("Error fetching financial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateSummary = (data) => {
    const latestEntry = data[data.length - 1];
    return {
      income: latestEntry?.income || 0,
      expenses: latestEntry?.expenses || 0,
      date: formatDate(latestEntry?.entry_date),
    };
  };

  const formatChartData = (data) => {
    return data.map((entry) => ({
      date: formatDate(entry.entry_date),
      income: parseFloat(entry.income),
      expenses: Math.abs(parseFloat(entry.expenses)),
    }));
  };

  return (
    <div className="income-expenses-comparison-chart-container">
      <div className="summary-section">
        <p className="income-summary" style={{ color: "#4a90e2" }}>
          {formatCash(summary.income || 0)}
        </p>
        <p className="expenses-summary" style={{ color: "#f44336" }}>
          {formatCash(summary.expenses || 0)}
        </p>
        <p className="date-summary">{summary.date || "Loading..."}</p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} style={{ background: "transparent" }}>
            <XAxis dataKey="date" tick={false} axisLine={false} />
            <Tooltip
              formatter={(value) => formatCash(value)}
              content={({ payload }) => {
                if (payload && payload.length) {
                  const { date, income, expenses } = payload[0].payload;
                  return (
                    <div className="tooltip-content">
                      <p style={{ color: "#4a90e2" }}>
                        Income: {formatCash(income)}
                      </p>
                      <p style={{ color: "#f44336" }}>
                        Expenses: {formatCash(expenses)}
                      </p>
                      <p className="chart-date">{date}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="income"
              fill="#4a90e2"
              isAnimationActive={true}
              radius={[5, 5, 5, 5]}
              barSize={55}
            />
            <Bar
              dataKey="expenses"
              fill="#f44336"
              isAnimationActive={true}
              radius={[5, 5, 5, 5]}
              barSize={55}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default IncomeExpensesComparisonChart;

// import React, { useState, useEffect } from "react";
// import { fetchFinancials } from "../api/FinancialAPI";
// import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
// import { formatDate, formatCash } from "../func/functions";

// const IncomeExpensesComparisonChart = () => {
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [chartData, setChartData] = useState([]);
//   const [summary, setSummary] = useState({
//     income: null,
//     expenses: null,
//     date: null,
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const financials = await fetchFinancials();
//         const sortedData = financials.sort(
//           (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
//         );

//         setChartData(formatChartData(sortedData));
//         setSummary(calculateSummary(sortedData));
//       } catch (error) {
//         setError("Error fetching financial data");
//         console.error("Error fetching financial data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const calculateSummary = (data) => {
//     const latestEntry = data[data.length - 1];
//     return {
//       income: latestEntry?.income || 0,
//       expenses: latestEntry?.expenses || 0,
//       date: formatDate(latestEntry?.entry_date),
//     };
//   };

//   const formatChartData = (data) => {
//     return data.map((entry) => ({
//       date: formatDate(entry.entry_date),
//       income: parseFloat(entry.income),
//       expenses: Math.abs(parseFloat(entry.expenses)),
//     }));
//   };

//   return (
//     <div className="income-expenses-comparison-chart-container">
//       <div className="summary-section">
//         <p className="income-summary" style={{ color: "#4a90e2" }}>
//           {formatCash(summary.income || 0)}
//         </p>
//         <p className="expenses-summary" style={{ color: "#f44336" }}>
//           {formatCash(summary.expenses || 0)}
//         </p>
//         <p className="date-summary">{summary.date || "Loading..."}</p>
//       </div>

//       {loading ? (
//         <div>Loading...</div>
//       ) : error ? (
//         <div>{error}</div>
//       ) : (
//         <ResponsiveContainer width="100%" height={300}>
//           <LineChart data={chartData} style={{ background: "transparent" }}>
//             <XAxis dataKey="date" tick={false} axisLine={false} />
//             <Tooltip
//               cursor={false}
//               formatter={(value) => formatCash(value)}
//               content={({ payload }) => {
//                 if (payload && payload.length) {
//                   const { date, income, expenses } = payload[0].payload;
//                   return (
//                     <div className="tooltip-content">
//                       <p style={{ color: "#4a90e2" }}>
//                         Income: {formatCash(income)}
//                       </p>
//                       <p style={{ color: "#f44336" }}>
//                         Expenses: {formatCash(expenses)}
//                       </p>
//                       <p className="chart-date">{date}</p>
//                     </div>
//                   );
//                 }
//                 return null;
//               }}
//             />
//             <Line
//               type="monotone"
//               dataKey="income"
//               stroke="#4a90e2"
//               strokeWidth={2}
//               dot={false}
//             />
//             <Line
//               type="monotone"
//               dataKey="expenses"
//               stroke="#f44336"
//               strokeWidth={2}
//               dot={false}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       )}
//     </div>
//   );
// };

// export default IncomeExpensesComparisonChart;
