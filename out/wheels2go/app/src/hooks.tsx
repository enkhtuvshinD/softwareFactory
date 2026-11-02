import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiRequestError } from './api';
import type { User } from '../shared/types';

interface SessionValue {
  users: User[];
  user: User | null;
  switchUser: (id: string) => void;
}

export const SessionContext = createContext<SessionValue>({ users: [], user: null, switchUser: () => {} });
export const useSession = () => useContext(SessionContext);

interface ToastItem {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

interface ToastValue {
  notify: (kind: ToastItem['kind'], message: string) => void;
}

export const ToastContext = createContext<ToastValue>({ notify: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const notify = useCallback((kind: ToastItem['kind'], message: string) => {
    counter.current += 1;
    const id = counter.current;
    setItems([{ id, kind, message }]);
  }, []);
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toasts">
        {items.map((item) => (
          <div key={item.id} className={`toast toast-${item.kind}`} data-testid="toast" role="status" aria-live="polite">
            <span>{item.message}</span>
            <button type="button" className="toast-dismiss" onClick={() => setItems([])}>
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof ApiRequestError ? e.message : 'Something went wrong');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
