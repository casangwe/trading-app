import React, { useState, useEffect } from "react";
import { fetchFinancials } from "../api/FinancialAPI";
import { formatDate, formatCash } from "../func/functions";
import NewFinancial from "./NewFinancial";

const Financial = () => {
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const getFinancials = async () => {
      try {
        const data = await fetchFinancials();
        setFinancials(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    getFinancials();
  }, []);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleNewEntrySuccess = (newEntry) => {
    setFinancials((prevFinancials) => [newEntry, ...prevFinancials]);
    handleCloseModal();
  };

  if (loading) {
    return <div>Loading financials...</div>;
  }

  if (error) {
    return <div>Error fetching financials: {error}</div>;
  }

  return (
    <div className="financial-table-container">
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
            <th>Comments</th>
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
              <td>{entry.comments || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <NewFinancial
          onClose={handleCloseModal}
          onSuccess={handleNewEntrySuccess}
        />
      )}
    </div>
  );
};

export default Financial;
