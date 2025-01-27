import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { fetchDailyPnls } from "../api/DailyPNLApi";
import { fetchTransactions } from "../api/TransactionsAPI";
import { formatCash } from "../func/functions";

const Calender = () => {
  const [dailyPNLData, setDailyPNLData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [componentLoading, setComponentLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalDetails, setModalDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dailyPNLs, transactionData] = await Promise.all([
          fetchDailyPnls(),
          fetchTransactions(),
        ]);

        setDailyPNLData(dailyPNLs);
        setTransactions(transactionData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => {
          setComponentLoading(false);
          setTimeout(() => setHasLoaded(true), 100);
        }, 1000);
      }
    };

    fetchData();
  }, []);

  const calculateTransactionsForPeriod = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transaction_date);
      return transactionDate >= start && transactionDate <= end;
    });

    const totalDeposits = filteredTransactions
      .filter((t) => t.transaction_type === "deposit")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalWithdrawals = filteredTransactions
      .filter((t) => t.transaction_type === "withdrawal")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return { totalDeposits, totalWithdrawals };
  };

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
        const startDate = entries[0].entry_date;
        const endDate = entries[entries.length - 1].entry_date;

        monthData.initial_open_cash = parseFloat(entries[0].open_cash || 0);
        monthData.final_close_cash = parseFloat(
          entries[entries.length - 1].close_cash || 0
        );

        // Aggregate transactions for the month
        const { totalDeposits, totalWithdrawals } =
          calculateTransactionsForPeriod(startDate, endDate);

        monthData.total_deposits = totalDeposits;
        monthData.total_withdrawals = totalWithdrawals;

        // Calculate net deposits and total cash invested
        const totalInvested =
          monthData.total_deposits -
          monthData.total_withdrawals +
          monthData.initial_open_cash;

        // Calculate ROI
        if (totalInvested === 0) {
          monthData.roi = 0;
        } else {
          monthData.roi = (
            ((monthData.final_close_cash - totalInvested) / totalInvested) *
            100
          ).toFixed(2);
        }
      }
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
        const startDate = entries[0].entry_date;
        const endDate = entries[entries.length - 1].entry_date;

        yearData.initial_open_cash = parseFloat(entries[0].open_cash || 0);
        yearData.final_close_cash = parseFloat(
          entries[entries.length - 1].close_cash || 0
        );

        // Aggregate transactions for the year
        const { totalDeposits, totalWithdrawals } =
          calculateTransactionsForPeriod(startDate, endDate);

        yearData.total_deposits = totalDeposits;
        yearData.total_withdrawals = totalWithdrawals;

        // Calculate net deposits and total cash invested
        const totalInvested =
          yearData.total_deposits -
          yearData.total_withdrawals +
          yearData.initial_open_cash;

        // Calculate ROI
        if (totalInvested === 0) {
          yearData.roi = 0;
        } else {
          yearData.roi = (
            ((yearData.final_close_cash - totalInvested) / totalInvested) *
            100
          ).toFixed(2);
        }
      }
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
            <FaArrowDown style={{ color: "f44336" }} />
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
          parseFloat(monthlyEntry.balance) >= 0 ? (
            <FaArrowUp style={{ color: "#4a90e2" }} />
          ) : (
            <FaArrowDown style={{ color: "#f44336" }} />
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
          parseFloat(yearlyEntry.balance) >= 0 ? (
            <FaArrowUp style={{ color: "#4a90e2" }} />
          ) : (
            <FaArrowDown style={{ color: "#f44336" }} />
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

  return (
    <div className="calendar-container">
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <div
          className={`calendar-content ${
            hasLoaded ? "fades-in" : "fades-in-hidden"
          }`}
        >
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={tileContent}
            onClickDay={(date) => handleTileClick(date, "month")}
            onActiveStartDateChange={({ activeStartDate, view }) =>
              // handleTileClick(activeStartDate, view)
              setModalDetails(null)
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
      )}
    </div>
  );
};
export default Calender;
