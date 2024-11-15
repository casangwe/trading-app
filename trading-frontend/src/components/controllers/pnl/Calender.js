import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import { formatCash } from "../func/functions";

const Calender = () => {
  const [dailyPNLData, setDailyPNLData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalDetails, setModalDetails] = useState(null);

  useEffect(() => {
    const fetchDailyPNLData = async () => {
      try {
        const data = await fetchDailyPnls();
        setDailyPNLData(data);
      } catch (error) {
        setError("Error fetching Daily PNL data");
        console.error("Error fetching Daily PNL data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyPNLData();
  }, []);

  const aggregateByMonth = () => {
    const monthlyData = {};

    dailyPNLData.sort(
      (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
    );

    dailyPNLData.forEach((entry) => {
      const date = new Date(entry.entry_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          initial_open_cash: entry.open_cash,
          final_close_cash: entry.close_cash,
          balance: parseFloat(entry.balance),
          roi: 0,
          entries: [],
        };
      } else {
        monthlyData[monthKey].balance += parseFloat(entry.balance);
        monthlyData[monthKey].final_close_cash = entry.close_cash;
      }
      monthlyData[monthKey].entries.push(entry);
    });
    Object.keys(monthlyData).forEach((monthKey) => {
      const monthData = monthlyData[monthKey];
      const { entries } = monthData;
      if (entries.length > 0) {
        monthData.initial_open_cash = entries[0].open_cash;
        monthData.final_close_cash = entries[entries.length - 1].close_cash;
      } else {
        console.log("No data");
      }
      monthData.roi = (
        ((parseFloat(monthData.final_close_cash) -
          parseFloat(monthData.initial_open_cash)) /
          parseFloat(monthData.initial_open_cash)) *
        100
      ).toFixed(2);
    });
    console.log(monthlyData);
    return monthlyData;
  };

  const aggregateByYear = () => {
    const yearlyData = {};

    dailyPNLData.forEach((entry) => {
      const date = new Date(entry.entry_date);
      const yearKey = date.getFullYear();

      if (!yearlyData[yearKey]) {
        yearlyData[yearKey] = {
          initial_open_cash: entry.open_cash,
          final_close_cash: entry.close_cash,
          balance: parseFloat(entry.balance),
          roi: 0,
          entries: [],
        };
      } else {
        yearlyData[yearKey].balance += parseFloat(entry.balance);
        yearlyData[yearKey].final_close_cash = entry.close_cash;
      }
      yearlyData[yearKey].entries.push(entry);
    });

    Object.keys(yearlyData).forEach((yearKey) => {
      const yearData = yearlyData[yearKey];
      const { entries } = yearData;

      if (entries.length > 0) {
        yearData.initial_open_cash = entries[0].open_cash;
        yearData.final_close_cash = entries[entries.length - 1].close_cash;
      }
      yearData.roi = (
        ((parseFloat(yearData.final_close_cash) -
          parseFloat(yearData.initial_open_cash)) /
          parseFloat(yearData.initial_open_cash)) *
        100
      ).toFixed(2);
    });
    return yearlyData;
  };

  const tileContent = ({ date, view }) => {
    const formattedDate = date.toISOString().split("T")[0];

    if (view === "month") {
      const pnlEntry = dailyPNLData.find(
        (pnl) => pnl.entry_date === formattedDate
      );

      if (pnlEntry) {
        const icon =
          parseFloat(pnlEntry.open_cash) <= parseFloat(pnlEntry.close_cash) ? (
            <FaArrowUp style={{ color: "#4a90e2" }} />
          ) : (
            <FaArrowDown style={{ color: "red" }} />
          );

        return (
          <div className="pnl-tile">
            <div>{icon}</div>
            <div>{formatCash(pnlEntry.balance)}</div>
            <div>{pnlEntry.roi}%</div>
          </div>
        );
      }
    } else if (view === "year") {
      const monthlyData = aggregateByMonth();
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthlyEntry = monthlyData[monthKey];

      if (monthlyEntry) {
        const icon =
          parseFloat(monthlyEntry.final_close_cash) >
          parseFloat(monthlyEntry.initial_open_cash) ? (
            <FaArrowUp style={{ color: "#4a90e2" }} />
          ) : (
            <FaArrowDown style={{ color: "red" }} />
          );

        return (
          <div className="pnl-tile">
            <div>{icon}</div>
            <div>{formatCash(monthlyEntry.balance)}</div>
            <div>{monthlyEntry.roi}%</div>
          </div>
        );
      }
    } else if (view === "decade") {
      const yearlyData = aggregateByYear();
      const yearKey = date.getFullYear();
      const yearlyEntry = yearlyData[yearKey];

      if (yearlyEntry) {
        const icon =
          parseFloat(yearlyEntry.final_close_cash) >
          parseFloat(yearlyEntry.initial_open_cash) ? (
            <FaArrowUp style={{ color: "#4caf50" }} />
          ) : (
            <FaArrowDown style={{ color: "red" }} />
          );

        return (
          <div className="pnl-tile">
            <div>{icon}</div>
            <div>{formatCash(yearlyEntry.balance)}</div>
            <div>{yearlyEntry.roi}%</div>
          </div>
        );
      }
    }

    return null;
  };
  const handleTileClick = (date, view) => {
    let modalDetails = null;

    if (view === "month") {
      const formattedDate = date.toISOString().split("T")[0];
      const pnlEntry = dailyPNLData.find(
        (pnl) => pnl.entry_date === formattedDate
      );

      if (pnlEntry) {
        const formattedDateForDisplay = `${
          date.getMonth() + 1
        }/${date.getDate()}`;
        modalDetails = { date: formattedDateForDisplay, ...pnlEntry };
      }
    } else if (view === "year") {
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthlyData = aggregateByMonth();
      const monthlyEntry = monthlyData[monthKey];

      if (monthlyEntry) {
        modalDetails = { date: monthKey, ...monthlyEntry };
      }
    } else if (view === "decade") {
      const yearKey = date.getFullYear();
      const yearlyData = aggregateByYear();
      const yearlyEntry = yearlyData[yearKey];

      if (yearlyEntry) {
        modalDetails = { date: yearKey, ...yearlyEntry };
      }
    }

    if (modalDetails) {
      setModalDetails(modalDetails);
    }
  };

  const handleCloseModal = () => {
    setModalDetails(null);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="calendar-container">
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={tileContent}
        onClickDay={(date) => handleTileClick(date, "month")}
        onActiveStartDateChange={({ activeStartDate, view }) =>
          handleTileClick(activeStartDate, view)
        }
      />
      {modalDetails && (
        <div className="modal-container">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{modalDetails.date}</h2>
              <button className="close-button" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p className="no-id">
                N<sup>o</sup>: {`000${modalDetails.id}`.slice(-5)}
              </p>
              <hr />
              <div className="modal-row">
                <span className="label">Open:</span>
                <span className="separator"></span>
                <span className="value">
                  {formatCash(modalDetails.open_cash)}
                </span>
              </div>
              <div className="modal-row">
                <span className="label">Close:</span>
                <span className="separator"></span>
                <span className="value">
                  {formatCash(modalDetails.close_cash)}
                </span>
              </div>
              <span className="hrs">
                <hr />
              </span>

              <div className="modal-row">
                <span className="label">Balance:</span>
                <span className="separator"></span>
                <span className="value">
                  {formatCash(modalDetails.balance)}
                </span>
              </div>
              <div className="modal-row">
                <span className="label">RoI:</span>
                <span className="separator"></span>
                <span className="value">{modalDetails.roi}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calender;
