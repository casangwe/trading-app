// src/hooks/useTransactions.js

import { useCallback, useEffect, useRef, useState } from "react";
import { getTransactions } from "../api/transactions.api";

export const useTransactions = (params) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔒 lock params reference unless caller truly changes it
  const paramsRef = useRef(params || {});

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getTransactions(paramsRef.current);
      setTransactions(res || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    isEmpty: !loading && transactions.length === 0,
    refreshTransactions: fetchTransactions,
  };

  // return {
  //   transactions,
  //   loading,
  //   error,
  //   isEmpty: !loading && transactions.length === 0,
  //   refreshTransactions: fetchTransactions,
  // };
};
