import React, { useState, useEffect } from "react";
import { fetchFinancials } from "../api/FinancialAPI";
import { formatDate, formatCash } from "../func/functions";
import NewFinancial from "./NewFinancial";

const FinancialTable = ({ onNewFinancial }) => {
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [componentLoading, setComponentLoading] = useState(true);
  const [fadeInTable, setFadeInTable] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setComponentLoading(false);
    }, 1500);
    fetchFinancialData();
  }, []);

  const fetchFinancialData = () => {
    setLoading(true);
    setError(null);
    setFadeInTable(false);

    setTimeout(async () => {
      try {
        const data = await fetchFinancials();
        setFinancials(data);
      } catch (err) {
        setError("Error fetching financials");
        console.error(err);
      } finally {
        setLoading(false);
        setTimeout(() => setFadeInTable(true), 1000);
      }
    }, 1000);
  };

  const handleNewFinancialEntry = async (newEntry) => {
    setShowModal(false);
    if (onNewFinancial) onNewFinancial(newEntry);

    setFinancials([]);
    setLoading(true);
    setFadeInTable(false);

    await fetchFinancialData();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className="financial-table-wrapper">
      {componentLoading && (
        <div className="component-loading-spinner-wrapper">
          <div className="spinner"></div>
        </div>
      )}

      <div
        className={`financial-table-container ${
          !componentLoading ? "fade-in" : "loading"
        }`}
      >
        {!componentLoading && (
          <>
            {loading && (
              <div className="spinner-wrapper">
                <div className="spinner"></div>
              </div>
            )}

            {!loading && error ? (
              <div className="error-message">{error}</div>
            ) : (
              <>
                <div className="header-card">
                  <p className="title">Financial</p>
                  <div className="tooltip">
                    <i
                      className="btn btn-primary fa-solid fa-plus"
                      id="financial-new-btn"
                      onClick={handleOpenModal}
                    ></i>
                    <span className="tooltiptext">New Entry</span>
                  </div>
                </div>
                <hr />
                <div className={`fade-in ${fadeInTable ? "visible" : ""}`}>
                  <table className="financial-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Income</th>
                        <th>Expenses</th>
                        <th>NEC</th>
                        <th>FFA</th>
                        <th>PLAY</th>
                        <th>LTSS</th>
                        <th>GIVE</th>
                        <th>Net Worth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financials.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.entry_date)}</td>
                          <td>{formatCash(entry.income)}</td>
                          <td>{formatCash(entry.expenses)}</td>
                          <td>{formatCash(entry.NEC)}</td>
                          <td>{formatCash(entry.FFA)}</td>
                          <td>{formatCash(entry.PLAY)}</td>
                          <td>{formatCash(entry.LTSS)}</td>
                          <td>{formatCash(entry.GIVE)}</td>
                          <td>{formatCash(entry.networth)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {showModal && (
                  <NewFinancial
                    onClose={handleCloseModal}
                    onNewFinancial={handleNewFinancialEntry}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialTable;
