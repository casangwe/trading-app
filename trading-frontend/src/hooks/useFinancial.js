//src/hooks/useFinancial.js

import { useEffect, useState } from "react";
import {
  getFinancials,
  getLatestFinancial,
} from "../api/financial.api";

export const useFinancial = () => {
  const [entries, setEntries] = useState([]);
  const [latest, setLatest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchFinancials = async () => {
      try {
        const [listRes, latestRes] = await Promise.all([
          getFinancials(),
          getLatestFinancial(),
        ]);

        if (!mounted) return;

        setEntries(listRes || []);
        setLatest(latestRes || null);
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFinancials();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    entries,
    latest,
    loading,
    error,
    isEmpty: !loading && entries.length === 0,
  };
};
