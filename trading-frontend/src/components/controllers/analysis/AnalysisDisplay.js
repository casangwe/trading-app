import React, { useState, useEffect } from "react";
import { performAnalysis } from "./AnalysisGet";

const AnalysisDisplay = () => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await performAnalysis();
        setAnalysisResults(results);
      } catch (err) {
        setError(err);
      }
    };

    fetchData();
  }, []);

  const {
    numberOfTrades = 0,
    winningTrades = 0,
    losingTrades = 0,
  } = analysisResults || {};

  return (
    <div className="analysis-container">
      <div className="analysis-row">
        <div className="analysis-circle">
          <h3>Trades</h3>
          <p>{numberOfTrades}</p>
        </div>
        <div className="analysis-circle">
          <h3>Wins</h3>
          <p>{winningTrades}</p>
        </div>
        <div className="analysis-circle">
          <h3>Losses</h3>
          <p>{losingTrades}</p>
        </div>
      </div>
      <div className="analysis-circle-row"></div>
    </div>
  );
};

export default AnalysisDisplay;
