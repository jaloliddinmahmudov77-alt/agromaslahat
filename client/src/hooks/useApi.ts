import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Meta } from '../lib/types';

/** GET so'rovini bajaradi; url null bo'lsa kutib turadi. */
export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .get<T>(url)
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}

let metaCache: Promise<Meta> | null = null;

export function useMeta() {
  const [meta, setMeta] = useState<Meta | null>(null);
  useEffect(() => {
    metaCache ??= api.get<Meta>('/meta').catch((e) => {
      metaCache = null;
      throw e;
    });
    metaCache.then(setMeta).catch(() => {});
  }, []);
  return meta;
}
