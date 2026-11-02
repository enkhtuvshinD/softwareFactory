import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export const POLL_INTERVAL_MS = 2000;

export interface PollingState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => Promise<void>;
}

export function usePolling<T>(fetcher: () => Promise<T>, deps: unknown[] = [], intervalMs = POLL_INTERVAL_MS): PollingState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const generation = useRef(0);

  const load = useCallback(async () => {
    const mine = generation.current;
    try {
      const result = await fetcherRef.current();
      if (mine !== generation.current) return;
      setData(result);
      setError(null);
    } catch (caught) {
      if (mine !== generation.current) return;
      setError(caught instanceof ApiError ? caught : new ApiError('ERROR', 'Something went wrong', {}));
    } finally {
      if (mine === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    generation.current += 1;
    setData(null);
    setError(null);
    setLoading(true);
    void load();
    const timer = setInterval(() => void load(), intervalMs);
    return () => {
      generation.current += 1;
      clearInterval(timer);
    };
  }, [load, intervalMs, ...deps]);

  return { data, error, loading, reload: load };
}
