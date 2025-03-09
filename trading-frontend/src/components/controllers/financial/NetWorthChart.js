import React, { useState, useEffect } from "react";
import { fetchFinancials } from "../api/FinancialAPI";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCash, formatDate } from "../func/functions";

const NetWorthChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [componentLoading, setComponentLoading] = useState(true);
  const [summary, setSummary] = useState({
    networth: null,
    previousNetworth: null,
    difference: null,
    date: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const financials = await fetchFinancials();
        const sortedData = financials.sort(
          (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
        );

        const formattedData = sortedData.map((entry) => ({
          date: formatDate(entry.entry_date),
          networth: parseFloat(entry.networth),
        }));

        setChartData(formattedData);

        if (sortedData.length > 1) {
          const latest = sortedData[sortedData.length - 1];
          const previous = sortedData[sortedData.length - 2];
          const networth = parseFloat(latest.networth);
          const previousNetworth = parseFloat(previous.networth);
          const difference = networth - previousNetworth;
          const percentChange =
            previousNetworth !== 0 ? (difference / previousNetworth) * 100 : 0;

          setSummary({
            networth,
            previousNetworth,
            difference,
            percentChange,
            date: formatDate(latest.entry_date),
          });
        } else if (sortedData.length === 1) {
          const latest = sortedData[0];
          setSummary({
            networth: parseFloat(latest.networth),
            previousNetworth: null,
            difference: null,
            date: formatDate(latest.entry_date),
          });
        }
      } catch (error) {
        setError("Error fetching financial data");
        console.error("Error fetching financial data:", error);
      } finally {
        setTimeout(() => setComponentLoading(false), 1000);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="networth-chart">
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="summary-section">
            <p className="networth-cash">{formatCash(summary.networth || 0)}</p>
            {summary.difference !== null && (
              <p className="networth-change">
                {formatCash(summary.difference)} (
                {summary.percentChange.toFixed(2)}%)
              </p>
            )}
            <p className="networth-date">{summary.date}</p>
          </div>

          {error ? (
            <div>{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} style={{ background: "transparent" }}>
                <XAxis dataKey="date" tick={false} axisLine={false} />
                <Tooltip
                  cursor={false}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const { date, networth } = payload[0].payload;
                      return (
                        <div className="tooltip-content">
                          <p className="networth-tooltip">
                            {formatCash(networth)}
                          </p>
                          <p className="networth-date">{date}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="networth"
                  stroke="#4a90e2"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
};

export default NetWorthChart;
