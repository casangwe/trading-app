import React from "react";
import AnalysisCircle from "../controllers/analysis/AnalysisCircle";
import EQTCurve from "../controllers/trades/EQTcurve";
import AnalysisSummary from "../controllers/analysis/AnalysisSummary";

const Analysis = () => {
  return (
    <div className="Analysis">
      <div className="eqt-and-summary-container">
        <div className="eqt-analysis">
          <EQTCurve />
        </div>
        <div className="summary-analysis">
          <AnalysisSummary />
        </div>
      </div>
      <div className="analysis-analysis">
        <AnalysisCircle />
      </div>
    </div>
  );
};

export default Analysis;
