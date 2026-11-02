import { Link } from 'react-router-dom';
import { formatDuration } from '../../shared/labels';
import type { TicketView } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

interface TicketResultProps {
  ticket: TicketView;
  onBookAnother: () => void;
}

export function TicketResult({ ticket, onBookAnother }: TicketResultProps) {
  return (
    <section className="card ticket-result" data-testid="ticket-result" aria-label="Your new ticket">
      <h2 className="card-title">Your ticket</h2>
      <p className="ticket-number big" data-testid="ticket-number">
        {ticket.ticketNumber}
      </p>
      <StatusBadge status={ticket.status} testId="ticket-status" />
      <p>
        {ticket.serviceName} · {ticket.branchName}
      </p>
      {ticket.position !== null && <p data-testid="ticket-position">Position {ticket.position}</p>}
      {ticket.estimatedWaitMinutes !== null && (
        <p data-testid="ticket-wait">Est. wait {formatDuration(ticket.estimatedWaitMinutes)}</p>
      )}
      <div className="button-row">
        <Link className="btn btn-primary" to="/customer/tickets">
          View My Tickets
        </Link>
        <button type="button" className="btn btn-secondary" onClick={onBookAnother}>
          Book another
        </button>
      </div>
    </section>
  );
}
