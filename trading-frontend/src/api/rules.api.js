//src/api/rules.api.js

import api from "./axios";

/**
 * List trading rules / notes.
 */
export const getRules = async (params = {}) => {
  const res = await api.get("/rules", { params });
  return res.data;
};

/**
 * Create rule.
 */
export const createRule = async (payload) => {
  const res = await api.post("/rules", payload);
  return res.data;
};
