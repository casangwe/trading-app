// src/hooks/useRealizedPnl.js

import { useCallback, useEffect, useState } from "react";
import { getRealizedPnl } from "../api/dashboard.api";

export const useRealizedPnl = (initialRange = "1W") => {
  const [range, setRange] = useState(initialRange);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getRealizedPnl(range);
      setData(payload);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    range,
    setRange,
    data,
    loading,
    error,
    refresh: fetch,
  };
};
