//src/hooks/useTrades.js

import { useCallback, useEffect, useRef, useState } from "react";
import { getTrades } from "../api/trades.api";

export const useTrades = (params) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔒 lock params reference once unless caller actually changes it
  const paramsRef = useRef(params || {});

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getTrades(paramsRef.current);
      setTrades(res || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return {
    trades,
    loading,
    error,
    isEmpty: !loading && trades.length === 0,
    refreshTrades: fetchTrades,
  };
};
