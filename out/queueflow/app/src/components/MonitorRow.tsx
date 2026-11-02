import { formatClockTime, formatCounter } from '../../shared/labels';
import type { TicketView } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

interface MonitorRowProps {
  ticket: TicketView;
}

export function MonitorRow({ ticket }: MonitorRowProps) {
  return (
    <li className="data-row monitor-row" data-testid="monitor-row" data-id={ticket.id} data-number={ticket.ticketNumber}>
      <span className="cell cell-strong ticket-number" data-testid="monitor-number">
        {ticket.ticketNumber}
      </span>
      <span className="cell" data-testid="monitor-branch">
        {ticket.branchName}
      </span>
      <span className="cell" data-testid="monitor-service">
        {ticket.serviceName}
      </span>
      <span className="cell">{ticket.customerName}</span>
      <span className="cell">
        <StatusBadge status={ticket.status} testId="monitor-status" />
      </span>
      <span className="cell" data-testid="monitor-counter">
        {formatCounter(ticket.counterNumber)}
      </span>
      <span className="cell" data-testid="monitor-staff">
        {ticket.staffName ?? '—'}
      </span>
      <span className="cell muted">{formatClockTime(ticket.createdAt)}</span>
    </li>
  );
}
