// src/hooks/useTradeStats.js
import { useCallback, useEffect, useState } from "react";
import { getDashboardStats } from "../api/dashboard.api";

export default function useTradeStats() {
  const [stats, setStats] = useState(null);

  // like your useCharts: loading = in-flight but we keep old data on screen
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getDashboardStats();
      setStats(res);
    } catch (e) {
      // keep last known good stats to avoid flicker/blank
      setError("Failed to load trade stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, loading, error, refreshStats };
}
