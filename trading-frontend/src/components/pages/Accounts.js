import React, { useEffect, useState } from "react";
import Cash from "../controllers/cash/Cash";
import NewCash from "../controllers/cash/NewCash";
import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
import TransactionTable from "../controllers/transactions/TransactionTable";
import InvestmentChart from "../controllers/pnl/InvestmentChart";
import EQTCurve from "../controllers/trades/EQTcurve";
import Rules from "../controllers/rules/Rules";

const Accounts = ({ onClose }) => {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const storedUserData = localStorage.getItem("user_data");
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
    }
  }, []);

  // Modal handlers
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleNewCash = (newCash) => {
    console.log("New cash entry:", newCash);
  };

  return (
    <div className="accounts">
      {/* Header Section */}
      <div className="accounts-dash">
        <div className="header-card">
          {userData && (
            <p className="title">
              {/* Welcome, {userData.fname || userData.username}! */}
            </p>
          )}
          <div className="tooltip">
            <i
              className="btn btn-primary fa-solid fa-plus"
              id="new-cash-btn"
              onClick={handleOpenModal}
            ></i>
            <span className="tooltiptext">Add Cash</span>
          </div>
        </div>
      </div>

      <div className="cash-accounts">
        <Cash />
      </div>
      <div className="investment-chart">
        <InvestmentChart />
      </div>
      <div className="analysis-analysis-account">
        <AnalysisDisplay />
      </div>
      <div className="account-horizontal">
        <div className="transactions-accounts">
          <TransactionTable />
        </div>
        <div className="rules-accounts">
          <Rules />
        </div>
      </div>

      <div className="eqt-curve">
        <EQTCurve />
      </div>

      {showModal && (
        <NewCash onClose={handleCloseModal} onNewCash={handleNewCash} />
      )}
    </div>
  );
};

export default Accounts;

// import React, { useEffect, useState } from "react";
// import Cash from "../controllers/cash/Cash";
// import NewCash from "../controllers/cash/NewCash";
// import TransactionTable from "../controllers/transactions/TransactionTable";
// import InvestmentChart from "../controllers/pnl/InvestmentChart";

// const Accounts = ({ onClose }) => {
//   const [userData, setUserData] = useState(null);
//   const [showModal, setShowModal] = useState(false);

//   useEffect(() => {
//     const storedUserData = localStorage.getItem("user_data");
//     if (storedUserData) {
//       const parsedUserData = JSON.parse(storedUserData);
//       setUserData(parsedUserData);
//     }
//   }, []);

//   const handleOpenModal = () => {
//     setShowModal(true);
//   };

//   const handleCloseModal = () => {
//     setShowModal(false);
//   };

//   const handleNewCash = (newCash) => {
//     console.log("New cash entry:", newCash);
//   };

//   return (
//     <div className="accounts">
//       <div className="accounts-dash">
//         <div className="header-card">
//           {userData && (
//             <p className="title">
//               {/* Welcome {userData.fname || userData.username} */}
//             </p>
//           )}
//           <div class="tooltip">
//             <i
//               className="btn btn-primary fa-solid fa-plus"
//               id="new-cash-btn"
//               onClick={handleOpenModal}
//             ></i>
//             <span class="tooltiptext">Add Cash</span>
//           </div>
//         </div>
//       </div>

//       <div className="cash-accounts">
//         <Cash />
//       </div>
//       <div className="dashboard-container-home">
//         <div className="profit-chart-trade">
//           <InvestmentChart />
//         </div>
//       </div>

//       {/* <div className="cash-accounts">
//         <Cash />
//       </div> */}
//       {showModal && (
//         <NewCash onClose={handleCloseModal} onNewCash={handleNewCash} />
//       )}
//       <div className="transactions-accounts">
//         <TransactionTable />
//       </div>
//     </div>
//   );
// };

// export default Accounts;
