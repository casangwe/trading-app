import React from "react";
import TradeTable from "../controllers/trades/TradeTable";
import Watchlist from "../controllers/watchlist/Watchlist";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisSummary from "../controllers/analysis/AnalysisSummary";

const Trades = () => {
  return (
    <div className="trades">
      <div className="eqt-and-summary-container">
        <div className="eqt-trades">
          <EQTCurve />
        </div>
        <div className="summary-trades">
          <AnalysisSummary />
        </div>
      </div>

      <div className="trades-trade">
        <TradeTable />
      </div>
    </div>
  );
};

export default Trades;
