import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { performAnalysis } from "./AnalysisGet";
import { Line } from "rc-progress";

const AnalysisDisplay = () => {
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

  // if (error) {
  //   console.error("Error fetching analysis data:", error);
  // }

  if (!analysisResults && !error) {
    return <div></div>;
  }

  const {
    absoluteReturn = 0,
    sharpeRatio = 0,
    winRate = 0,
    numberOfTrades = 0,
    winningTrades = 0,
    losingTrades = 0,
    averageWin = 0,
    averageLoss = 0,
    riskRewardRatio = 0,
  } = analysisResults || {};
  const total = averageWin + averageLoss;
  const winPercent = total > 0 ? (averageWin / total) * 100 : 50;
  const formatCash = (value) => `$${value.toFixed(2)}`;
  const absoluteReturnPercentage = absoluteReturn * 100;
  const sharpeRatioPercentage = (sharpeRatio / 3) * 100;

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
  const formatValue = (value, isCurrency = false) => {
    if (isNaN(value) || value === undefined) {
      return isCurrency ? "$0.00" : "N/A";
    }
    return isCurrency ? `$${value.toFixed(2)}` : `${value.toFixed(2)}`;
  };
  return (
    <div className="analysis-container">
      {/* <br /> */}
      <div className="analysis-circle-row">
        {/* Win Rate */}
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={winRateData}
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              // stroke="none"
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

        {/* Win Ratio */}
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={[
                { name: "Wins", value: winningTrades, color: "#4a90e2" },
                { name: "Losses", value: losingTrades, color: "#f44336" },
              ]}
              innerRadius={50}
              outerRadius={70}
              startAngle={90}
              endAngle={-270}
              // stroke="none"
              dataKey="value"
            >
              {[
                { name: "Wins", value: winningTrades, color: "#4a90e2" },
                { name: "Losses", value: losingTrades, color: "#f44336" },
              ].map((entry, index) => (
                <Cell
                  key={`winloss-cell-${index}`}
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
                  const wins = winningTrades;
                  const losses = losingTrades;
                  const winRatio =
                    losses > 0 ? `${wins} : ${losses}` : `${wins} : 0`;

                  return (
                    <div className="tooltip-content">
                      <p>Win Ratio</p>
                      <p className="amount">{winRatio}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Average Win / Loss */}
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
              // stroke="none"
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

export default AnalysisDisplay;
