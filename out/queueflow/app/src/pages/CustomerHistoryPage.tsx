import { api } from '../api/client';
import { buildHistory } from '../../shared/history';
import { AsyncView } from '../components/AsyncView';
import { HistoryRow } from '../components/HistoryRow';
import { usePolling } from '../hooks/usePolling';

function loadHistory() {
  return Promise.all([api.myTickets(), api.myAppointments()]).then(([tickets, appointments]) =>
    buildHistory(tickets, appointments),
  );
}

export function CustomerHistoryPage() {
  const state = usePolling(loadHistory);
  return (
    <>
      <h1 className="page-title">History</h1>
      <AsyncView state={state} label="history">
        {(entries) =>
          entries.length === 0 ? (
            <p className="card state-card" data-testid="history-empty">
              No history yet
            </p>
          ) : (
            <ul className="data-list card" aria-label="Past tickets and appointments">
              <li className="data-row data-head" aria-hidden="true">
                <span className="cell">Ticket</span>
                <span className="cell">Status</span>
                <span className="cell">Branch</span>
                <span className="cell">Service</span>
                <span className="cell">Time (UTC)</span>
              </li>
              {entries.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )
        }
      </AsyncView>
    </>
  );
}
