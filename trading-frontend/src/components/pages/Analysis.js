import React from "react";
import Bars from "../controllers/pnl/Bars";
import Calendar from "../controllers/pnl/Calender";
import TradeSum from "../controllers/trades/TradeSum";
import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
import AnalysisCircle from "../controllers/analysis/AnalysisCircle";
import InvestmentChart from "../controllers/pnl/InvestmentChart";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisSummary from "../controllers/analysis/AnalysisSummary";

const Analysis = () => {
  return (
    <div className="Analysis">
      <div className="eqt-analysis-sum-container">
        <div className="eqt-curve-trade">
          <EQTCurve />
        </div>
        <div className="analysis-sum-trade">
          <AnalysisSummary />
        </div>
      </div>
      <div className="analysis-analysis">
        <AnalysisCircle />
      </div>
      {/* <div className="analysis-analysis">
        <Bars />
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
