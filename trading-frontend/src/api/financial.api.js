// src/api/financial.api.js

import api from "./axios";

/**
 * List financial entries.
 */
export const getFinancials = async (params = {}) => {
  const res = await api.get("/financial/", { params });
  return res.data;
};

/**
 * Get latest financial entry.
 */
export const getLatestFinancial = async () => {
  const res = await api.get("/financial/latest");
  return res.data;
};

/**
 * Get single financial entry by ID.
 */
export const getFinancialById = async (id) => {
  const res = await api.get(`/financial/${id}`);
  return res.data;
};

/**
 * Create financial entry.
 */
export const createFinancial = async (payload) => {
  const res = await api.post("/financial/", payload);
  return res.data;
};

/**
 * Update financial entry.
 */
export const updateFinancial = async (id, payload) => {
  const res = await api.put(`/financial/${id}`, payload);
  return res.data;
};

/**
 * Delete financial entry.
 */
export const deleteFinancial = async (id) => {
  await api.delete(`/financial/${id}`);
};
