import type { ReactNode } from 'react';
import type { PollingState } from '../hooks/usePolling';

interface AsyncViewProps<T> {
  state: PollingState<T>;
  label: string;
  children: (data: T) => ReactNode;
}

export function AsyncView<T>({ state, label, children }: AsyncViewProps<T>) {
  if (state.data !== null) return <>{children(state.data)}</>;
  if (state.error) {
    return (
      <div className="card state-card" data-testid="error-state" role="alert">
        <p>
          <span aria-hidden="true">⚠ </span>
          {state.error.message || `Could not load ${label}`}
        </p>
        <button type="button" className="btn btn-secondary" data-testid="retry" onClick={() => void state.reload()}>
          Retry
        </button>
      </div>
    );
  }
  return (
    <div className="card state-card" data-testid="loading-state" aria-busy="true">
      <div className="skeleton" />
      <p className="muted">Loading {label}…</p>
    </div>
  );
}
