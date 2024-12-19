import React, { useEffect, useState } from "react";
import DailyPNL from "../controllers/pnl/DailyPNL";
import NewDailyPNL from "../controllers/pnl/NewDailyPNL";
import Calendar from "../controllers/pnl/Calender";
import MiniTradeTable from "../controllers/trades/MiniTradeTable";
import Bars from "../controllers/pnl/Bars";
import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
import InvestmentChart from "../controllers/pnl/InvestmentChart";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisCircle from "../controllers/analysis/AnalysisCircle";

const Home = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
    }
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleNewDailyPNL = (newDailyPNL) => {
    console.log("New daily PNL entry:", newDailyPNL);
  };

  return (
    <div className="home">
      <div className="home-dash">
        <div className="header-card">
          {userData && (
            <p className="title">
              {/* Welcome {userData.fname || userData.username} */}
            </p>
          )}
          <div className="tooltip">
            <i
              className="btn btn-primary fa-solid fa-plus"
              id="new-pnl-btn"
              onClick={handleOpenModal}
            ></i>
            <span className="tooltiptext">New P/L</span>
          </div>
        </div>
      </div>
      <div className="dashboard-container">
        <div className="profit-chart-trade">
          <InvestmentChart />
        </div>
        <div className="pnl-home">
          <DailyPNL />
        </div>
      </div>

      {showModal && (
        <NewDailyPNL
          onClose={handleCloseModal}
          onNewDailyPNL={handleNewDailyPNL}
        />
      )}

      {/* Calendar and Bars side by side */}
      <div className="calendar-bars-container">
        <div className="bars-home">
          <Bars />
        </div>
        <div className="calendar-home">
          <Calendar />
        </div>
      </div>

      {/* AnalysisDisplay in full width */}

      <div className="eqt-curve-trade">
        <EQTCurve />
      </div>
      <div className="analysis-display-container">
        <AnalysisDisplay />
      </div>

      <div className="analysis-analysis">
        <AnalysisCircle />
      </div>
      {/* Trades Table and EQTchat side by side */}
      {/* <div className="trades-eqt-container">
        <div className="trades-table">
          <MiniTradeTable />
        </div>
        <div className="eqt-chart">
          <EQTCurve />
        </div>
      </div> */}
    </div>
  );
};

export default Home;
