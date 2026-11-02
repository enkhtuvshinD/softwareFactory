import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { formatClockTime } from '../../shared/labels';
import { AsyncView } from '../components/AsyncView';
import { DisplayBoard } from '../components/DisplayBoard';
import { usePolling } from '../hooks/usePolling';

function BranchSelect({ onChange }: { onChange: (branchId: string) => void }) {
  const state = usePolling(api.branches, [], 10000);
  return (
    <AsyncView state={state} label="branches">
      {(branches) => (
        <div className="display-select">
          <label htmlFor="display-branch-select">Branch</label>
          <select id="display-branch-select" data-testid="display-branch-select" value="" onChange={(e) => onChange(e.target.value)}>
            <option value="">Select a branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </AsyncView>
  );
}

function BranchDisplay({ branchId }: { branchId: string }) {
  const state = usePolling(() => api.display(branchId), [branchId]);
  const clock = usePolling(api.clock);
  return (
    <>
      <header className="display-header">
        <h1 data-testid="display-title">{state.data?.branchName ?? 'Queue display'}</h1>
        <span className="display-clock">{clock.data ? `UTC ${formatClockTime(clock.data.now)}` : ''}</span>
      </header>
      <AsyncView state={state} label="queue display">
        {(view) => <DisplayBoard view={view} />}
      </AsyncView>
    </>
  );
}

export function DisplayPage() {
  const [params, setParams] = useSearchParams();
  const branchId = params.get('branchId');
  return (
    <div className="display-page">
      {branchId ? (
        <BranchDisplay branchId={branchId} />
      ) : (
        <>
          <header className="display-header">
            <h1 data-testid="display-title">Queue display</h1>
          </header>
          <BranchSelect onChange={(id) => id && setParams({ branchId: id })} />
        </>
      )}
    </div>
  );
}
