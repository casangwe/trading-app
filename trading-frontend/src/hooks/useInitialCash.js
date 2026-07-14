// src/hooks/useInitialCash.js

import { useCallback, useEffect, useState } from "react";
import {
  getInitialCash,
  createInitialCash,
  updateInitialCash,
  deleteInitialCash,
} from "../api/initialCash.api";

const useInitialCash = () => {
  const [initialCash, setInitialCash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const refreshInitialCash = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInitialCash();
      setInitialCash(data ?? null);
    } catch (err) {
      setError(err);
      setInitialCash(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInitialCash();
  }, [refreshInitialCash]);

  const create = useCallback(async (payload) => {
    setSaving(true);
    setError(null);

    try {
      const created = await createInitialCash(payload);
      setInitialCash(created);
      return created;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback(async (payload) => {
    setSaving(true);
    setError(null);

    try {
      const updated = await updateInitialCash(payload);
      setInitialCash(updated);
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const remove = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      await deleteInitialCash();
      setInitialCash(null);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    initialCash,
    loading,
    saving,
    error,
    hasInitialCash: !!initialCash,
    refreshInitialCash,
    createInitialCash: create,
    updateInitialCash: update,
    deleteInitialCash: remove,
  };
};

export default useInitialCash;