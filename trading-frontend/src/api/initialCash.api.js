// src/api/initialCash.api.js

import api from "./axios";

/**
 * Get the current user's initial cash row.
 * Returns:
 * - object when initial cash exists
 * - null when it does not exist yet
 */
export const getInitialCash = async () => {
  const res = await api.get("/initial-cash/");
  return res.data;
};

/**
 * Create the current user's initial cash row.
 */
export const createInitialCash = async (payload) => {
  const res = await api.post("/initial-cash/", payload);
  return res.data;
};

/**
 * Update the current user's initial cash row.
 */
export const updateInitialCash = async (payload) => {
  const res = await api.put("/initial-cash/", payload);
  return res.data;
};

/**
 * Delete the current user's initial cash row.
 */
export const deleteInitialCash = async () => {
  const res = await api.delete("/initial-cash/");
  return res.data;
};