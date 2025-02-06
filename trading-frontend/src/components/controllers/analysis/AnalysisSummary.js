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
              <h3>Wins</h3>
              <p>{analysisData ? `${analysisData.winningTrades}` : "N/A"}</p>
            </div>{" "}
            {/* Absolute Return - Main Center Circle */}
            <div className="loss">
              <h3>Losses</h3>
              <p>{analysisData ? `${analysisData.losingTrades}` : "N/A"}</p>
            </div>
            {/* Absolute Return - Main Center Circle */}
            <div className="abs-return">
              <h3>Absolute return</h3>
              <p>
                {analysisData
                  ? `${analysisData.absoluteReturn.toFixed(2)}%`
                  : "N/A"}
              </p>
            </div>
            {/* Sharpe Ratio - "2 o'clock" position */}
            <div className="sharpe-ratio">
              <h3>Sharpe Ratio</h3>
              <p>
                {analysisData
                  ? `${analysisData.sharpeRatio.toFixed(2)}`
                  : "Sharpe Ratio: N/A"}
              </p>
            </div>
            {/* Risk Reward - "3 o'clock" position */}
            <div className="risk-reward">
              <h3>Risk Reward</h3>
              <p>
                {analysisData
                  ? `${analysisData.riskRewardRatio.toFixed(2)}`
                  : "R/R: N/A"}
              </p>
            </div>
            {/* Days in Trade - "4 o'clock" position */}
            <div className="avg-days">
              <h3>Days</h3>
              <p>
                {analysisData
                  ? `${analysisData.avgDaysInTrade.toFixed(0)}`
                  : "Avg. Days: N/A"}
              </p>
            </div>
          </div>

          {/* Error Handling */}
          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </div>
  );

  // return (
  //   <div className="analysis-summary-container">
  //     {/* Initial Component Loading Spinner */}
  //     {componentLoading ? (
  //       <div className="component-loading-spinner-wrapper">
  //         <div className="spinner"></div>
  //       </div>
  //     ) : (
  //       <>
  //         {/* Summary Section for Analysis Data */}
  //         <div className="analysis-circle-summary">
  //           <div className="abs-return">
  //             <h3>Abs. return</h3>
  //             <p>
  //               {analysisData
  //                 ? `${analysisData.absoluteReturn.toFixed(2)}`
  //                 : "N/A"}
  //             </p>
  //           </div>{" "}
  //           <div className="risk-reward">
  //             <h3>Risk Reward</h3>
  //             <p>
  //               {analysisData
  //                 ? `${analysisData.riskRewardRatio.toFixed(2)}`
  //                 : "R/R: N/A"}
  //             </p>
  //           </div>{" "}
  //           <div className="sharpe-ratio">
  //             <h3>Sharpe Ratio</h3>
  //             <p>
  //               {analysisData
  //                 ? `${analysisData.sharpeRatio.toFixed(2)}`
  //                 : "Sharpe Ratio: N/A"}
  //             </p>
  //           </div>{" "}
  //           <div className="avg-days">
  //             <h3>Days</h3>
  //             <p>
  //               {analysisData
  //                 ? `${analysisData.avgDaysInTrade.toFixed(1)}`
  //                 : "Avg. Days: N/A"}{" "}
  //             </p>
  //           </div>{" "}
  //         </div>

  //         {/* Error Handling */}
  //         {error && <div className="error-message">{error}</div>}
  //       </>
  //     )}
  //   </div>
  // );
};

export default AnalysisSummary;
