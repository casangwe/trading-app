//src/api/dashboard.api.js

import api from "./axios";
import client from "./client";


/**
 * Fetch full dashboard payload for Home.
 */

export const getDashboard = async () => {
  const res = await client.get("/dashboard", {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  return res.data;
};

/**
 * Fetch detailed stats (Portfolio KPIs).
 */
export const getDashboardStats = async () => {
  const res = await api.get("/dashboard/stats");
  return res.data;
};

/**
 * Fetch chart-ready dashboard data.
 */
export const getDashboardCharts = async () => {
  const res = await api.get("/dashboard/charts");
  return res.data;
};

/**
 * Fetch realized PnL data.
 */
export const getRealizedPnl = async (range = "1W") => {
  const res = await api.get("/dashboard/realized-pnl", { params: { range } });
  return res.data; // { range, granularity, start, end, bars: [...] }
};
