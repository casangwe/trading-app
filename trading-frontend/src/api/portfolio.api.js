//src/api/portfolio.api.js

import api from "./axios";

/**
 * List all portfolio entries.
 */
export const getPortfolio = async (params = {}) => {
  const res = await api.get("/portfolio/", { params });
  return res.data;
};

/**
 * Get latest portfolio entry.
 */
export const getLatestPortfolio = async () => {
  const res = await api.get("/portfolio/latest");
  return res.data;
};

/**
 * Create a new portfolio entry.
 */
export const createPortfolioEntry = async (payload) => {
  const res = await api.post("/portfolio/", payload);
  return res.data;
};

/**
 * Update an existing portfolio entry.
 */
export const updatePortfolioEntry = async (id, payload) => {
  const res = await api.put(`/portfolio/${id}`, payload);
  return res.data;
};

/**
 * Delete portfolio entry.
 */
export const deletePortfolioEntry = async (id) => {
  await api.delete(`/portfolio/${id}`);
};
