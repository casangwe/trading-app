import React, { useEffect, useState } from "react";
import DailyPNL from "../controllers/pnl/DailyPNL";
import NewDailyPNL from "../controllers/pnl/NewDailyPNL";
import Calendar from "../controllers/pnl/Calender";
import Bars from "../controllers/pnl/Bars";
import InvestmentChart from "../controllers/pnl/InvestmentChart";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisSummary from "../controllers/analysis/AnalysisSummary";

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
      <div className="investment-and-dailypnl-container">
        <div className="investment-home">
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

      <div className="bars-and-calendar-container">
        <div className="bars-home">
          <Bars />
        </div>
        <div className="calendar-home">
          <Calendar />
        </div>
      </div>

      <div className="eqt-and-summary-container">
        <div className="eqt-home">
          <EQTCurve />
        </div>
        <div className="summary-home">
          <AnalysisSummary />
        </div>
      </div>
    </div>
  );
};

export default Home;
