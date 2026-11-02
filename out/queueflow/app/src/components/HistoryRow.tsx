import { formatDateTime } from '../../shared/labels';
import type { HistoryEntry } from '../../shared/history';
import { StatusBadge } from './StatusBadge';

interface HistoryRowProps {
  entry: HistoryEntry;
}

export function HistoryRow({ entry }: HistoryRowProps) {
  return (
    <li
      className="data-row history-row"
      data-testid="history-row"
      data-id={entry.id}
      data-number={entry.ticketNumber ?? undefined}
    >
      <span className="cell cell-strong" data-testid="history-label">
        {entry.ticketNumber ?? 'Appointment'}
      </span>
      <span className="cell">
        <StatusBadge {...entry.badge} testId="history-status" />
      </span>
      <span className="cell" data-testid="history-branch">
        {entry.branchName}
      </span>
      <span className="cell" data-testid="history-service">
        {entry.serviceName}
      </span>
      <span className="cell muted" data-testid="history-time">
        {formatDateTime(entry.time)}
      </span>
    </li>
  );
}
