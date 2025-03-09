import React, { useState, useEffect } from "react";
import { fetchFinancials } from "../api/FinancialAPI";
import {
  calculateInitialNetworth,
  calculatePreviousNetworth,
  calculateCurrentNetworth,
  calculateNetworthDifference,
  calculateNetworthPercentChange,
} from "./NetworthCalc";
import { formatCash } from "../func/functions";

const NetworthCash = () => {
  const [networthData, setNetworthData] = useState({
    initialNetworth: 0,
    previousNetworth: 0,
    currentNetworth: 0,
    networthDifference: 0,
    percentChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getFinancials = async () => {
      try {
        let financialData = await fetchFinancials();

        financialData = [...financialData].sort(
          (a, b) => new Date(a.entry_date) - new Date(b.entry_date)
        );

        const initialNetworth = calculateInitialNetworth(financialData);
        const previousNetworth = calculatePreviousNetworth(financialData);
        const currentNetworth = calculateCurrentNetworth(financialData);
        const networthDifference = calculateNetworthDifference(
          previousNetworth,
          currentNetworth
        );
        const percentChange = calculateNetworthPercentChange(
          previousNetworth,
          currentNetworth
        );

        setNetworthData({
          initialNetworth,
          previousNetworth,
          currentNetworth,
          networthDifference,
          percentChange,
        });

        setLoading(false);
      } catch (error) {
        setError("Error fetching net worth data");
        setLoading(false);
      }
    };

    getFinancials();
  }, []);

  return (
    <div className="networth-summary">
      <div className="networth-card-container">
        <div className="networth-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Initial Net Worth:</span>
            </div>
            <span className="value">
              {formatCash(networthData.initialNetworth)}
            </span>
          </div>
        </div>
        <hr className="divider" />
        <div className="networth-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Current:</span>
            </div>
            <span className="value">
              {formatCash(networthData.currentNetworth)}
            </span>
          </div>
        </div>{" "}
        <div className="networth-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Previous:</span>
            </div>
            <span className="value">
              {formatCash(networthData.previousNetworth)}
            </span>
          </div>
        </div>{" "}
        <hr className="divider" />
        <div className="networth-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Difference:</span>
            </div>
            <span className="value">
              {formatCash(networthData.networthDifference)}
            </span>
          </div>
        </div>{" "}
        <div className="networth-card">
          <div className="card-content">
            <div className="icon-label">
              <span className="label">Change (%):</span>
            </div>
            <span className="value">
              {networthData.percentChange.toFixed(2)}%
            </span>
          </div>
        </div>{" "}
      </div>
    </div>
  );
};

export default NetworthCash;
