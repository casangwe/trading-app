import React from "react";
import Bars from "../controllers/pnl/Bars";
import Calendar from "../controllers/pnl/Calender";
import TradeSum from "../controllers/trades/TradeSum";
import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
import AnalysisCircle from "../controllers/analysis/AnalysisCircle";
import InvestmentChart from "../controllers/pnl/InvestmentChart";
import EQTCurve from "../controllers/trades/EQTcurve";

const Analysis = () => {
  return (
    <div className="Analysis">
      <div className="eqt-curve-trade">
        <EQTCurve />
      </div>
      <div className="analysis-analysis">
        <AnalysisDisplay />
      </div>
      <div className="analysis-analysis">
        <AnalysisCircle />
      </div>

      {/* <div className="two-horizontal-charts">
        {/* <div className="bars-home">
          <Bars />
        </div> */}

      {/* <div className="eqt-curve">
          <EQTCurve />
        </div> }
      </div> */}
      {/* Calendar and Bars side by side */}
      <div className="calendar-bars-container">
        {/* <div className="investment-chart">
          <InvestmentChart />
        </div> */}
        {/* <div className="bars-home">
          <Bars />
        </div> */}
        {/* <div className="investment-chart">
          <InvestmentChart />
        </div> */}
        {/* <div className="calendar-home">
          <Calendar />
        </div> */}
      </div>
      {/* <div className="trade-sum-analysis">
        <TradeSum />
      </div> */}
    </div>
  );
};

export default Analysis;

// import React from "react";
// import Bars from "../controllers/pnl/Bars";
// import TradeSum from "../controllers/trades/TradeSum";
// import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
// import InvestmentChart from "../controllers/pnl/InvestmentChart";
// import EQTCurve from "../controllers/trades/EQTcurve";

// const Analysis = () => {
//   return (
//     <div className="Analysis">
//       <div className="two-horizontal-analysis">
//         <div className="bars-analysis">
//           <Bars />
//         </div>
//         <div className="analysis-analysis">
//           <AnalysisDisplay />
//         </div>
//       </div>
//       <div className="two-horizontal-analysis">
//         <div className="">
//           <InvestmentChart />
//         </div>
//         <div className="">
//           <EQTCurve />
//         </div>
//       </div>

//       <div className="trade-sum-analysis">
//         <TradeSum />
//       </div>
//     </div>
//   );
// };

// export default Analysis;
