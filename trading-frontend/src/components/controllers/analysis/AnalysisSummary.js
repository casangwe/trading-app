import React, { useState, useEffect } from "react";
import { performAnalysis } from "../analysis/AnalysisGet";

const AnalysisSummary = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [error, setError] = useState(null);
  const [componentLoading, setComponentLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const results = await performAnalysis();
        setAnalysisData(results);
      } catch (err) {
        setError("Failed to load analysis data.");
      } finally {
        setTimeout(() => setComponentLoading(false), 1000);
      }
    };

    fetchAnalysisData();
  }, []);

  return (
    <div className="analysis-summary-container">
      {/* Initial Component Loading Spinner */}
      {componentLoading ? (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Summary Section for Analysis Data */}
          <div className="analysis-circle-summary">
            {/* Absolute Return - Main Center Circle */}
            <div className="wins">
              <p>{analysisData ? `${analysisData.winningTrades}` : "N/A"}</p>
              <h3>Wins</h3>
            </div>{" "}
            {/* Absolute Return - Main Center Circle */}
            <div className="loss">
              <p>{analysisData ? `${analysisData.losingTrades}` : "N/A"}</p>
              <h3>Losses</h3>
            </div>
            <div className="win-rate">
              <p>
                {analysisData ? `${analysisData.winRate.toFixed(0)}` : "N/A"}
              </p>{" "}
              <h3>%</h3>
              {/* <h3>Rate</h3> */}
            </div>
            {/* Absolute Return - Main Center Circle */}
            <div className="abs-return">
              <p>{analysisData ? `${analysisData.numberOfTrades}` : "N/A"}</p>
              <h3>Trades</h3>
            </div>
            {/* Sharpe Ratio - "2 o'clock" position */}
            <div className="sharpe-ratio">
              <p>
                {analysisData
                  ? `${analysisData.sharpeRatio.toFixed(2)}`
                  : "Sharpe Ratio: N/A"}
              </p>
              <h3>Sharpe Ratio</h3>
            </div>
            {/* Risk Reward - "3 o'clock" position */}
            <div className="risk-reward">
              <p>
                {analysisData
                  ? `${analysisData.riskRewardRatio.toFixed(2)}`
                  : "R/R: N/A"}
              </p>
              <h3>Risk Reward</h3>
            </div>
            {/* Days in Trade - "4 o'clock" position */}
            <div className="avg-days">
              <p>
                {analysisData
                  ? `${analysisData.avgDaysInTrade.toFixed(0)}`
                  : "Avg. Days: N/A"}
              </p>
              <h3>Days</h3>
            </div>
          </div>

          {/* Error Handling */}
          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </div>
  );
};

export default AnalysisSummary;
