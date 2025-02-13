import React, { useState, useEffect } from "react";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { formatCash, formatDate } from "../func/functions";

const Bars = () => {
  const [dailyPNLData, setDailyPNLData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [view, setView] = useState("daily");
  const [view, setView] = useState("weekly");
  const [componentLoading, setComponentLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const fetchDailyPNLData = async () => {
      try {
        const data = await fetchDailyPnls();
        const filteredData = data.filter(
          (entry) => formatDate(entry.entry_date) !== "01/01"
        );

        if (filteredData.length === 0) {
          console.warn("sNo valid trading days after filtering out 1/1.");
        }

        setDailyPNLData(filteredData);
      } catch (error) {
        setError("No Daily PNL data");
        console.error("No Daily PNL data:", error);
      } finally {
        setTimeout(() => {
          setComponentLoading(false);
          setTimeout(() => setHasLoaded(true), 100);
        }, 1000);
      }
    };

    fetchDailyPNLData();
  }, []);

  const formatMonthYear = (dateStr) => {
    if (!dateStr || !dateStr.includes("-")) return "";
    const dateParts = dateStr.split("-");
    const month = dateParts[1];
    const year = dateParts[0];
    return `${month}/${year}`;
  };

  const getCurrentWeek = (data) => {
    const today = new Date();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekData = data.filter((entry) => {
      const entryDate = new Date(entry.entry_date);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    weekData.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));

    return weekData;
  };

  const getCurrentMonth = (data) => {
    const weeks = [];
    let week = [];
    const today = new Date();
    const currentMonth = today.getMonth();

    data.forEach((entry, index) => {
      const entryDate = new Date(entry.entry_date);
      if (entryDate.getMonth() === currentMonth) {
        week.push(entry);
        if ((index + 1) % 5 === 0) {
          week.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
          weeks.push(week);
          week = [];
        }
      }
    });

    if (week.length) {
      week.sort((a, b) => new Date(a.entry_date) - new Date(b.entry_date));
      weeks.push(week);
    }

    return weeks;
  };

  const getMonthsData = (data) => {
    const months = Array.from({ length: 12 }, () => []);
    data.forEach((entry) => {
      const entryDate = new Date(entry.entry_date);
      months[entryDate.getMonth()].push(entry);
    });
    return months.filter((month) => month.length > 0);
  };

  const calculateBars = () => {
    let barsData = [];

    if (view === "daily") {
      const currentWeek = getCurrentWeek(dailyPNLData);
      barsData = currentWeek
        .map((day) => ({
          date: formatDate(day.entry_date),
          balance: parseFloat(day.balance || 0),
          fill: day.balance >= 0 ? "#4a90e2" : "#f44336",
        }))
        .reverse();
    } else if (view === "weekly") {
      const currentMonth = getCurrentMonth(dailyPNLData);
      barsData = currentMonth.map((week) => {
        const weekBalance = week.reduce(
          (sum, day) => sum + parseFloat(day.balance || 0),
          0
        );
        return {
          date: `${formatDate(week[0].entry_date)} - ${formatDate(
            week[week.length - 1].entry_date
          )}`,
          balance: weekBalance,
          fill: weekBalance >= 0 ? "#4a90e2" : "#f44336",
        };
      });
    } else if (view === "monthly") {
      const months = getMonthsData(dailyPNLData);
      barsData = months
        .map((month) => {
          const monthBalance = month.reduce(
            (sum, day) => sum + parseFloat(day.balance || 0),
            0
          );
          return {
            date: formatMonthYear(month[0].entry_date),
            balance: monthBalance,
            fill: monthBalance >= 0 ? "#4a90e2" : "#f44336",
          };
        })
        .reverse();
    }

    return barsData;
  };

  const barsData = calculateBars();

  return (
    <div className="main-bars-container">
      <div className="header-card">
        <div className="tab-container">
          <button
            className={`tab-button ${view === "daily" ? "active" : ""}`}
            onClick={() => setView("daily")}
          >
            D
          </button>
          <button
            className={`tab-button ${view === "weekly" ? "active" : ""}`}
            onClick={() => setView("weekly")}
          >
            M
          </button>
          <button
            className={`tab-button ${view === "monthly" ? "active" : ""}`}
            onClick={() => setView("monthly")}
          >
            Y
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={barsData}
          layout="vertical"
          style={{ background: "transparent" }}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis type="number" tick={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="date"
            width={0}
            tick={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            formatter={(value) => formatCash(value)}
            content={({ payload }) => {
              if (payload && payload.length) {
                const { date, balance } = payload[0].payload;
                return (
                  <div className="tooltip-content">
                    <p>{formatCash(balance)}</p>
                    <p className="invest-date">{date}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="balance"
            isAnimationActive={true}
            radius={[5, 5, 5, 5]}
            barSize={55}
            fill={({ payload }) => payload.fill}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Bars;
