import React, { useEffect, useState } from "react";
import Cash from "../controllers/cash/Cash";
import NewCash from "../controllers/cash/NewCash";
import TransactionTable from "../controllers/transactions/TransactionTable";
import InvestmentChart from "../controllers/pnl/InvestmentChart";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisSummary from "../controllers/analysis/AnalysisSummary";
import TransactionDistribution from "../controllers/transactions/TransactionDistribution";

const Accounts = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
    }
  }, []);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleNewCash = (newCash) => {
    console.log("New cash entry:", newCash);
  };

  return (
    <div className="accounts">
      <div className="investment-and-cash-container">
        <div className="investment-accounts">
          <InvestmentChart />
        </div>
        <div className="cash-accounts">
          <Cash />
        </div>
      </div>

      <div className="transactions-and-rules-container">
        <div className="transactions-accounts">
          <TransactionTable />
        </div>
        <div className="transaction-distribution-accounts">
          <TransactionDistribution />
        </div>
      </div>
      <div className="eqt-and-summary-container">
        <div className="eqt-accounts">
          <EQTCurve />
        </div>
        <div className="summary-accounts">
          <AnalysisSummary />
        </div>
      </div>
      {showModal && (
        <NewCash onClose={handleCloseModal} onNewCash={handleNewCash} />
      )}
    </div>
  );
};

export default Accounts;
