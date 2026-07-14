//src/hooks/usePortfolio.js

import { useEffect, useState } from "react";
import {
  getPortfolio,
  getLatestPortfolio,
} from "../api/portfolio.api";

export const usePortfolio = () => {
  const [entries, setEntries] = useState([]);
  const [latest, setLatest] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchPortfolio = async () => {
      try {
        const [listRes, latestRes] = await Promise.all([
          getPortfolio(),
          getLatestPortfolio(),
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

    fetchPortfolio();

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
