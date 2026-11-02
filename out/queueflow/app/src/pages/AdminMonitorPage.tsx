import { useState } from 'react';
import { api } from '../api/client';
import { AsyncView } from '../components/AsyncView';
import { MonitorRow } from '../components/MonitorRow';
import { usePolling } from '../hooks/usePolling';

function loadMonitor() {
  return Promise.all([api.allTickets(), api.branches()]).then(([tickets, branches]) => ({ tickets, branches }));
}

export function AdminMonitorPage() {
  const state = usePolling(loadMonitor);
  const [branchId, setBranchId] = useState('');
  return (
    <>
      <h1 className="page-title">Monitor</h1>
      <AsyncView state={state} label="tickets">
        {({ tickets, branches }) => {
          const visible = branchId === '' ? tickets : tickets.filter((t) => t.branchId === branchId);
          return (
            <>
              <div className="toolbar">
                <div className="field">
                  <label htmlFor="monitor-branch-filter">Branch</label>
                  <select
                    id="monitor-branch-filter"
                    data-testid="monitor-branch-filter"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="muted" data-testid="monitor-count" aria-live="polite">
                  {visible.length} {visible.length === 1 ? 'ticket' : 'tickets'}
                </p>
              </div>
              {visible.length === 0 ? (
                <p className="card state-card">No tickets for this filter</p>
              ) : (
                <ul className="data-list card" aria-label="Today's tickets">
                  <li className="data-row data-head monitor-row" aria-hidden="true">
                    <span className="cell">Ticket</span>
                    <span className="cell">Branch</span>
                    <span className="cell">Service</span>
                    <span className="cell">Customer</span>
                    <span className="cell">Status</span>
                    <span className="cell">Counter</span>
                    <span className="cell">Staff</span>
                    <span className="cell">Created (UTC)</span>
                  </li>
                  {visible.map((ticket) => (
                    <MonitorRow key={ticket.id} ticket={ticket} />
                  ))}
                </ul>
              )}
            </>
          );
        }}
      </AsyncView>
    </>
  );
}
