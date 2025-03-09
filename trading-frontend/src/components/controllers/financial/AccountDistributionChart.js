import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchFinancials } from "../api/FinancialAPI";
import { formatCash } from "../func/functions";

const AccountDistributionChart = () => {
  const [accountData, setAccountData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const financials = await fetchFinancials();

        const latestEntry = financials.reduce((latest, current) =>
          new Date(current.entry_date) > new Date(latest.entry_date)
            ? current
            : latest
        );

        const data = [
          { name: "NEC", value: parseFloat(latestEntry.NEC), color: "#B0C4DE" },
          { name: "FFA", value: parseFloat(latestEntry.FFA), color: "#89CFF0" },
          {
            name: "PLAY",
            value: parseFloat(latestEntry.PLAY),
            color: "#E6E6FA",
          },
          {
            name: "LTSS",
            value: parseFloat(latestEntry.LTSS),
            color: "#4a90e2",
          },
          {
            name: "GIVE",
            value: parseFloat(latestEntry.GIVE),
            color: "#FFDAB9",
          },
        ];

        setAccountData(data);
      } catch (err) {
        console.error("Error fetching account data:", err);
        setError("Error fetching account data");
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="account-distribution-chart">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={accountData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            startAngle={90}
            endAngle={-270}
          >
            {accountData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  transition: "filter 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = `drop-shadow(0 0 5px ${entry.color})`;
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
                const { name, value } = payload[0].payload;
                return (
                  <div className="tooltip-content">
                    <p>{name}</p>
                    <p className="amount">{formatCash(value)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AccountDistributionChart;
