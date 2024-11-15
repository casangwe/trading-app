import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTransaction } from "../api/TransactionsAPI";

const NewTransaction = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    transaction_date: "",
    transaction_type: "deposit",
    amount: "",
    transaction_summary: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
      });

      console.log("Success:", response);
      onClose();
      navigate("/accounts", { replace: true });
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting transaction");
    }
  };

  return (
    <div className="modal">
      <div className="new-transaction-container">
        <div className="header-card">
          <p className="title">New Transaction</p>
          <p className="close-btn" onClick={onClose}>
            &times;
          </p>
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="form-container">
          <label>
            <input
              type="date"
              placeholder="Transaction Date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
              required
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="trade">Trade</option>
            </select>
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </label>
          <br />
          <label>
            <input
              type="text"
              placeholder="Summary"
              name="transaction_summary"
              value={formData.transaction_summary}
              onChange={handleChange}
            />
          </label>
          <br />
          <button type="submit">Add</button>
        </form>
      </div>
    </div>
  );
};

export default NewTransaction;
