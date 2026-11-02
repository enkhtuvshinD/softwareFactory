import { useCallback, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export interface ActionState {
  busy: boolean;
  error: ApiError | null;
  run: <T>(task: () => Promise<T>) => Promise<T | undefined>;
  clearError: () => void;
}

export function useAction(): ActionState {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const inFlight = useRef(false);

  const run = useCallback(async <T,>(task: () => Promise<T>) => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      return await task();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError('ERROR', 'Something went wrong', {}));
      return undefined;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  return { busy, error, run, clearError };
}
