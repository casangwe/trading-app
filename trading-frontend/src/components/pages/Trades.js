import React from "react";
import TradeTable from "../controllers/trades/TradeTable";
import Watchlist from "../controllers/watchlist/Watchlist";
import Misc from "../controllers/misc/Misc";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
import AnalysisCircle from "../controllers/analysis/AnalysisCircle";
import AnalysisSummary from "../controllers/analysis/AnalysisSummary";

const Trades = () => {
  return (
    <div className="trades">
      <div className="trades-horizontal">
        {/* <div className="misc-trade">
          <Misc />
        </div> */}
        <div className="watchlist-trade">
          <Watchlist />
        </div>
        <div className="misc-trade">
          <Misc />
        </div>
      </div>
      <div className="eqt-analysis-sum-container">
        <div className="eqt-curve-trade">
          <EQTCurve />
        </div>
        <div className="analysis-sum-trade">
          <AnalysisSummary />
        </div>
      </div>

      {/* <div className="eqt-curve-trade">
        <EQTCurve />
      </div> */}
      {/* <div className="analysis-display-container">
        <AnalysisDisplay />
      </div> */}
      {/* <div className="analysis-analysis-account">
        <AnalysisCircle />
      </div> */}
      <div className="trades-trade">
        <TradeTable />
      </div>
      {/* <div className="analysis-sum-trades">
        <AnalysisSummary />
      </div>
      <div className="eqt-analysis-sum-container"></div> */}
    </div>
  );
};

export default Trades;
