"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiData<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const payload = await response.json();
      setData(payload.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let active = true;
    fetch(url, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (active) setData(payload.data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url]);

  return { data, setData, loading, error, retry: load };
}
