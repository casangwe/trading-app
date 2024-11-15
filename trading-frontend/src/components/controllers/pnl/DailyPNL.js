import React, { useEffect, useState } from "react";
import {
  FaChartLine,
  FaPercentage,
  FaUpload,
  FaMoneyBillWave,
} from "react-icons/fa";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import { formatCash } from "../func/functions";

const DailyPNL = () => {
  const [dailyPNLData, setDailyPNLData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyPNLData = async () => {
      try {
        const data = await fetchDailyPnls();
        console.log(data);
        if (data.length > 0) {
          const sortedData = data.sort(
            (a, b) => new Date(b.entry_date) - new Date(a.entry_date)
          );
          setDailyPNLData(sortedData[0]);
        } else {
          setDailyPNLData(null);
        }
      } catch (error) {
        setError("No Daily PNL data");
        console.error("No Daily PNL data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyPNLData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const openCash = dailyPNLData
    ? formatCash(dailyPNLData.open_cash)
    : formatCash(0);
  const closeCash = dailyPNLData
    ? formatCash(dailyPNLData.close_cash)
    : formatCash(0);
  const balance = dailyPNLData
    ? formatCash(dailyPNLData.balance)
    : formatCash(0);
  const roi = dailyPNLData ? `${dailyPNLData.roi}%` : "0%";
  return (
    <div className="daily-pnl-section">
      <div className="daily-pnl-card-container">
        {/* Open Cash Card */}
        <div className="daily-pnl-card">
          <div className="card-content">
            <div className="icon-label">
              <FaMoneyBillWave className="card-icon" />
              <span className="label">Open Cash:</span>
            </div>
            <span className="value">{openCash}</span>
          </div>
        </div>

        {/* Close Cash Card */}
        <div className="daily-pnl-card">
          <div className="card-content">
            <div className="icon-label">
              <FaUpload className="card-icon" />
              <span className="label">Close Cash:</span>
            </div>
            <span className="value">{closeCash}</span>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div className="daily-pnl-card-container">
        {/* Balance Card */}
        <div className="daily-pnl-card">
          <div className="card-content">
            <div className="icon-label">
              <FaChartLine className="card-icon" />
              <span className="label">P/L:</span>
            </div>
            <span className="value">{balance}</span>
          </div>
        </div>

        {/* ROI Card */}
        <div className="daily-pnl-card">
          <div className="card-content">
            <div className="icon-label">
              <FaPercentage className="card-icon" />
              <span className="label">RoI:</span>
            </div>
            <span className="value">{roi}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPNL;
