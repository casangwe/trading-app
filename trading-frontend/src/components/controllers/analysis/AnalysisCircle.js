import React, { useState, useEffect } from "react";
import { Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { performAnalysis } from "./AnalysisGet";

const AnalysisCircle = () => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await performAnalysis();
        setAnalysisResults(results);
      } catch (err) {
        setError(err);
      }
    };

    fetchData();
  }, []);

  if (!analysisResults && !error) {
    return <div></div>;
  }

  const {
    winRate = 0,
    winningTrades = 0,
    losingTrades = 0,
    averageWin = 0,
    averageLoss = 0,
  } = analysisResults || {};
  const total = averageWin + averageLoss;
  const winPercent = total > 0 ? (averageWin / total) * 100 : 50;
  const formatCash = (value) => `$${value.toFixed(2)}`;

  const data = [
    {
      name: "Average Win",
      value: winPercent,
      color: "#4a90e2",
      amount: averageWin,
    },
    {
      name: "Average Loss",
      value: 100 - winPercent,
      color: "#f44336",
      amount: averageLoss,
    },
  ];

  const winRateData = [
    { name: "Win Rate", value: winRate, color: "#4a90e2" },
    { name: "Remaining", value: 100 - winRate, color: "#d8e3ef" },
  ];

  return (
    <div className="analysis-container">
      <div className="analysis-circle-row">
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={winRateData}
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
            >
              {winRateData.map((entry, index) => (
                <Cell
                  key={`winrate-cell-${index}`}
                  fill={entry.color}
                  style={{
                    transition: "filter 0.3s",
                    cursor: entry.name === "Win Rate" ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => {
                    if (entry.name === "Win Rate") {
                      e.currentTarget.style.filter = `drop-shadow(0 0 3px ${entry.color})`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                  }}
                />
              ))}
            </Pie>

            <Tooltip
              cursor={false}
              content={({ payload }) => {
                if (
                  payload &&
                  payload.length &&
                  payload[0].payload.name === "Win Rate"
                ) {
                  const { name, value } = payload[0].payload;
                  return (
                    <div className="tooltip-content">
                      <p>{name}</p>
                      <p className="amount">{`${value.toFixed(2)}%`}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              dataKey="value"
              startAngle={90}
              paddingAngle={1}
              endAngle={-270}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{
                    transition: "filter 0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = `drop-shadow(0 0 3px ${entry.color})`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = "none";
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              content={({ payload }) => {
                if (payload && payload.length) {
                  const { name, amount } = payload[0].payload;
                  return (
                    <div className="tooltip-content">
                      <p>{name}</p>
                      <p className="amount">{formatCash(amount)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <br />
    </div>
  );
};

export default AnalysisCircle;
