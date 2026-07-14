//src/api/transactions.api.js

import api from "./axios";

/**
 * List transactions.
 */
export const getTransactions = async (params = {}) => {
  const res = await api.get("/transactions/", { params });
  return res.data;
};

/**
 * Create transaction (deposit / withdrawal).
 */
export const createTransaction = async (payload) => {
  const res = await api.post("/transactions/", payload);
  return res.data;
};

/**
 * Update transaction.
 */
export const updateTransaction = async (id, payload) => {
  const res = await api.put(`/transactions/${id}`, payload);
  return res.data;
};

/**
 * Delete transaction.
 */
export const deleteTransaction = async (id) => {
  await api.delete(`/transactions/${id}`);
};
