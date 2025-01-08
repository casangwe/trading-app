import React from "react";
import TradeTable from "../controllers/trades/TradeTable";
import Watchlist from "../controllers/watchlist/Watchlist";
import Misc from "../controllers/misc/Misc";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisDisplay from "../controllers/analysis/AnalysisDisplay";
import AnalysisCircle from "../controllers/analysis/AnalysisCircle";

const Trades = () => {
  return (
    <div className="trades">
      <div className="trades-horizontal">
        <div className="watchlist-trade">
          <Watchlist />
        </div>
        <div className="misc-trade">
          <Misc />
        </div>
      </div>
      <div className="eqt-curve-trade">
        <EQTCurve />
      </div>
      {/* <div className="analysis-display-container">
        <AnalysisDisplay />
      </div> */}
      {/* <div className="analysis-analysis-account">
        <AnalysisCircle />
      </div> */}
      <div className="trades-trade">
        <TradeTable />
      </div>
    </div>
  );
};

export default Trades;
