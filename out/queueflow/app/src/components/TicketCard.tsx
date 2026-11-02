import { formatDuration } from '../../shared/labels';
import type { TicketView } from '../../shared/types';
import { StatusBadge } from './StatusBadge';

interface TicketCardProps {
  ticket: TicketView;
  onCancel: (ticket: TicketView) => void;
}

function messageFor(ticket: TicketView): string | null {
  if (ticket.status === 'called') return `Proceed to counter ${ticket.counterNumber}`;
  if (ticket.status === 'serving') return `Being served at counter ${ticket.counterNumber}`;
  return null;
}

export function TicketCard({ ticket, onCancel }: TicketCardProps) {
  const message = messageFor(ticket);
  const cancellable = ticket.status === 'waiting' || ticket.status === 'called';
  return (
    <article
      className={`card ticket-card ticket-card-${ticket.status}`}
      data-testid="ticket-card"
      data-id={ticket.id}
      data-number={ticket.ticketNumber}
    >
      <div className="ticket-head">
        <p className="ticket-number" data-testid="ticket-number">
          {ticket.ticketNumber}
        </p>
        <StatusBadge status={ticket.status} testId="ticket-status" />
      </div>
      <p>
        <span data-testid="ticket-service">{ticket.serviceName}</span> ·{' '}
        <span data-testid="ticket-branch">{ticket.branchName}</span>
      </p>
      {ticket.position !== null && (
        <p className="ticket-metric" data-testid="ticket-position">
          Position {ticket.position}
        </p>
      )}
      {ticket.estimatedWaitMinutes !== null && (
        <p className="ticket-metric" data-testid="ticket-wait">
          Est. wait {formatDuration(ticket.estimatedWaitMinutes)}
        </p>
      )}
      {message && (
        <p className="ticket-message" data-testid="ticket-message">
          {message}
        </p>
      )}
      {cancellable && (
        <button type="button" className="btn btn-danger-outline" data-testid="ticket-cancel" onClick={() => onCancel(ticket)}>
          Cancel Ticket
        </button>
      )}
    </article>
  );
}
