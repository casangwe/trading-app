//src/api/trades.api.js

import api from "./axios";

/**
 * List trades (optionally filtered).
 */
export const getTrades = async (params = {}) => {
  const res = await api.get("/trades/", { params });
  return res.data;
};

/**
 * Get single trade by ID.
 */
export const getTradeById = async (id) => {
  const res = await api.get(`/trades/${id}`);
  return res.data;
};

/**
 * Create trade.
 */
export const createTrade = async (payload) => {
  const res = await api.post("/trades/", payload);
  return res.data;
};

/**
 * Update trade.
 */
export const updateTrade = async (id, payload) => {
  const res = await api.put(`/trades/${id}`, payload);
  return res.data;
};

/**
 * Delete trade.
 */
export const deleteTrade = async (id) => {
  await api.delete(`/trades/${id}`);
};
